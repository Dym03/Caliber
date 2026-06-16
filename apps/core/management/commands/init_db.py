import logging
import re

from django.core.management.base import BaseCommand
from apps.core.models import Gene, GeneVariant, GeneticReport, Patient, PatientVariant, TranscriptAnnotation
import glob
import polars as pl
from openpyxl import load_workbook
from django.db import transaction

patient_cache = {}
gene_cache = {}
variant_cache = {}

def sheet_exists(path: str, sheet: str) -> bool:
    wb = load_workbook(path, read_only=True)
    return sheet in wb.sheetnames

def clean_str(value: object, null_if_empty: bool = False) -> str | None:
    if value is None or value == "-":
        return None if null_if_empty else ""
    cleaned = str(value).strip()
    
    return cleaned


def clean_int(value: object) -> int | None:
    if value in (None, "", "nan"):
        return None
    return int(value)

def normalize_var_type(var_type: str) -> str:
    if var_type is None:
        return ""
    var_type = var_type.lower()
    if var_type in ["single nucleotide variant", "snv"]:
        return "SNV"
    elif var_type in ["snp", "single nucleotide polymorphism"]:
        return "SNP"
    elif var_type in ["deletion", "del"]:
        return "DEL"
    elif var_type in ["insertion", "ins"]:
        return "INS"
    elif var_type in ["duplication", "dup"]:
        return "DUP"
    elif var_type in ["indel"]:
        return "INDEL"
    else:
        logging.warning(f"Unknown variation type: {var_type}")
        return var_type.upper()
    
def parse_excel_hgvs(excel_string):
    # Regex to split "NM_000059.3:c.432A>G" into base, version, and mutation
    match = re.match(r"(^[A-Z_]+_\d+)\.(\d+):(.*)", excel_string)
    if match:
        return match.group(1), match.group(2), match.group(3)
    return None, None, excel_string

def parse_row(row) -> dict:
    cleaned_data = {}
    cleaned_data["patient_id"] = clean_str(row.get("Name"))
    cleaned_data["gene_symbol"] = clean_str(row.get("Symbol") or row.get("Gene"))
    cleaned_data["variation_type"] = normalize_var_type(row.get("Variant_class") or row.get("Variation Type"))
    cleaned_data["chromosome"] = clean_str(row.get("Chr"))
    cleaned_data["position"] = clean_int(row.get("Coordinate") or row.get("Start Position"))
    cleaned_data["ref_allele"] = clean_str(row.get("Reference") or row.get("Ref"))
    cleaned_data["alt_allele"] = clean_str(row.get("Alternate") or row.get("Alt"))
    cleaned_data["dbSNP"] = clean_str(row.get("VEP dbSNP ID", "") or row.get("dbSNP", ""))
    cleaned_data["hgvs_coding"] = clean_str(row.get("HGVSc") or row.get("Transcript"))
    cleaned_data["hgvs_coding"] += clean_str(row.get("Nucleotide", ""))
    cleaned_data["hgvs_p"] = clean_str(row.get("HGVSp", "") or row.get("AA Change", ""))
    cleaned_data["category"] = clean_str(row.get("Kategorie"))
    cleaned_data["comment"] = clean_str(row.get("Komentář", ""))
    cleaned_data["exon"] = clean_str(row.get("Exon"))
    cleaned_data["zygosity"] = clean_str(row.get("Genotype") or row.get("Zygosity"))
    cleaned_data["gnomAD"] = clean_str(row.get("gnomAD AF") or row.get("gnomAD (Exome)"))

    cleaned_data["transcript_base"], cleaned_data["transcript_version"], cleaned_data["hgvs_c"] = parse_excel_hgvs(cleaned_data["hgvs_coding"])

    return cleaned_data

def persist_row(data: dict, file_name: str):
    if data["gene_symbol"] == "BTD" and data["ref_allele"] == "G" and data["alt_allele"] == "C":
        print(data)
    if data["patient_id"] not in patient_cache:
        patient, _ = Patient.objects.get_or_create(name=data["patient_id"])
        patient_cache[data["patient_id"]] = patient
    else:
        patient = patient_cache[data["patient_id"]]

    if data["gene_symbol"] not in gene_cache:
        gene, _ = Gene.objects.get_or_create(symbol=data["gene_symbol"])
        gene_cache[data["gene_symbol"]] = gene
    else:
        gene = gene_cache[data["gene_symbol"]]

    if (data["gene_symbol"], data["chromosome"], data["position"], data["variation_type"], data["hgvs_c"]) not in variant_cache:
        gene_variant, _ = GeneVariant.objects.get_or_create(
            chromosome=data["chromosome"],
            position=data["position"],
            ref_allele=data["ref_allele"],
            alt_allele=data["alt_allele"],            
            defaults={
                "gnomAD": data["gnomAD"],
                "dbsnp": data["dbSNP"],
                "variation_type": data["variation_type"],
            }
        )
        variant_cache[(data["gene_symbol"], data["chromosome"], data["position"], data["variation_type"], data["hgvs_c"])] = gene_variant
    else:
        gene_variant = variant_cache[(data["gene_symbol"], data["chromosome"], data["position"], data["variation_type"], data["hgvs_c"])]

    if (data["hgvs_c"], gene_variant.id) not in variant_cache:
        annotation, _ = TranscriptAnnotation.objects.get_or_create(
            variant=gene_variant,
            hgvs_c=data["hgvs_c"],
            defaults={
                "hgvs_p": data["hgvs_p"],
                "transcript_base": data["transcript_base"],
                "transcript_version": data["transcript_version"],
                "exon": data["exon"],
            }
        )
        variant_cache[(data["hgvs_c"], gene_variant.id)] = annotation

    # TODO - ADD date of the file creation as the created_at and updated_at so it matches the date of the report, not the date of the import
    report, _ = GeneticReport.objects.get_or_create(
        patient=patient,
        report_name=file_name
    )

    p_v, _ = PatientVariant.objects.get_or_create(
        report=report,
        variant=gene_variant,
        zygosity=data["zygosity"],
        category=data["category"],
        comment=data["comment"],
        reported_hgvs_c=data["hgvs_coding"]
    )

def parse_df(df: pl.DataFrame, file_name: str):
    """"
    Parses wanted fields excel data from the given DataFrame, the variable names depends on the format (Finalist/Franklin)
    """
    for row in df.iter_rows(named=True):
        cleaned_data = parse_row(row)
        persist_row(cleaned_data, file_name)
        


class Command(BaseCommand):

    DEFAULT_ROOT_DIR = "."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--root_dir",
            help="Sets the root directory for the imported xlxs files. Default is the current directory.",
            default=self.DEFAULT_ROOT_DIR,
        )
    
    def handle(self, *args: tuple, **options: dict) -> None:
        root_dir = options.get("root_dir") or self.DEFAULT_ROOT_DIR

        for file_name in glob.iglob(f"{root_dir}/**/*.xls*", recursive=True):
            print(f"Importing data from {file_name}...")
            df = None

            if file_name.endswith(".xlsx") and sheet_exists(file_name, "default"):
                df = pl.read_excel(file_name, sheet_name="default")
            else:
                try:
                    df = pl.read_excel(file_name, sheet_name="Filtr JI")
                except Exception as e:
                    df = pl.read_excel(file_name)
            
            with transaction.atomic():
                parse_df(df, file_name)

        