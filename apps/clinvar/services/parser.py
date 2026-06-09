import logging
from dataclasses import dataclass

from apps.core.management.commands.init_db import normalize_var_type

try:
    from lxml import etree
    logging.info("running with lxml.etree")
except ImportError:
    import xml.etree.ElementTree as etree
    logging.info("running with Python's xml.etree.ElementTree")




@dataclass
class ParsedVariant:
    gene: str
    chromosome: str
    position: int
    variation_id: int
    variation_type: str
    last_updated: str

    hgvsc: str | None
    hgvsp: str | None

    dbsnp: str | None

def process_variation(variation_elem) -> ParsedVariant | None:
    allele_record = variation_elem.find(".//SimpleAllele")
    if allele_record is None:
        return

    hgvs_c, hgvs_p = _get_mane_hgvs(allele_record)
    if not hgvs_c:
        return

    # 3. Extract Basic Variation Data
    var_id = variation_elem.get("VariationID")
    last_updated = variation_elem.get("DateLastUpdated")
    variation_type = normalize_var_type(variation_elem.get("VariationType"))
    
    logging.info(f"Processing variation with ID: {var_id}")

    genes, locs = _get_genes_and_locs(allele_record)

    # 5. Extract dbSNP rsID
    db_snp = _get_dbsnp(allele_record)

    return ParsedVariant(
        variation_id=var_id,
        variation_type=variation_type,
        last_updated=last_updated,
        genes=genes,
        hgvsc=hgvs_c,
        hgvsp=hgvs_p,
        dbsnp=db_snp,
        locations=locs
    )

def _get_mane_hgvs(allele_record: etree.Element) -> tuple:
    """Finds the first coding HGVS with a MANESelect nucleotide expression."""
    
    for hgvs in allele_record.findall("HGVSlist/HGVS"):
        if hgvs.get("Type") != "coding":
            continue
            
        nuc_expr = hgvs.find("NucleotideExpression")
        if nuc_expr is not None and nuc_expr.get("MANESelect") == "true":
            # .findtext safely returns the string or None if the tag doesn't exist
            hgvs_c = nuc_expr.findtext("Expression")
            
            prot_expr = hgvs.find("ProteinExpression")
            hgvs_p = prot_expr.findtext("Expression") if prot_expr is not None else None
            
            return hgvs_c, hgvs_p
            
    return None, None


def _get_genes_and_locs(allele_record: etree.Element) -> tuple:
    """Extracts gene symbols and their GRCh38 sequence locations."""
    genes = []
    locs = {}
    
    for gene in allele_record.findall("GeneList/Gene"):
        symbol = gene.get("Symbol")
        if not symbol:
            continue
            
        genes.append(symbol)
        
        # Use a list comprehension to concisely filter GRCh38 locations
        grch38_locs = [
            (loc.get("Chr"), loc.get("start"))
            for loc in gene.findall("Location/SequenceLocation")
            if loc.get("Assembly") == "GRCh38"
        ]
        
        if grch38_locs:
            locs[symbol] = grch38_locs
            for chrom, pos in grch38_locs:
                print(f"Gene: {symbol}, Chromosome: {chrom}, Position: {pos}")
                
    return genes, locs


def _get_dbsnp(allele_record: etree.Element) -> str:
    """Extracts the rsID from dbSNP."""
    for xref in allele_record.findall("XRefList/XRef"):
        if xref.get("DB") == "dbSNP" and xref.get("Type") == "rs":
            return xref.get("ID")
    return None

def parse_clinvar_xml(file_path: str):
    release = etree.iterparse(file_path, events=("start",), tag="ClinVarVariationRelease")
    _, release = next(release)
    print(release.get("ReleaseDate"))

    context = etree.iterparse(file_path, events=("end",), tag="VariationArchive")
    for event, elem in context:
        
        parsed = process_variation(elem)
        if parsed:
            yield parsed

        elem.clear()
    