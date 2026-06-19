from dataclasses import dataclass

from apps.clinvar.services.parser import ParsedVariant, TranscriptAnnotation
from apps.core.enums import ClassificationEnum


@dataclass
class TransformedVariant:
    variation_id: int
    variation_type: str
    chromosome: str | None
    position: int | None
    ref_allele: str | None
    alt_allele: str | None
    dbsnp: str | None
    disease: str | None
    last_updated: str
    genes: list[str]
    transcript_annotations: list[TranscriptAnnotation]

    # Unified Enum replaces the raw classification string
    classification: ClassificationEnum


def transform_clinvar_classification(clinvar_class: str | None) -> ClassificationEnum:
    """
    Transforms ClinVar's free-text classification into our standardized enum.
    Handles common inconsistencies and compound terms gracefully.
    """
    return ClassificationEnum.from_clinvar_string(clinvar_class)


def transform_clinvar_variant(parsed_variant: ParsedVariant) -> TransformedVariant:
    """
    Transforms a ParsedVariant into the format expected by our GeneVariant model.
    This includes normalizing chromosome names, handling missing data, and mapping classifications.
    """
    transformed = (
        parsed_variant.__dict__.copy()
    )  # Start with a shallow copy of the parsed data

    chrom = transformed.get("chromosome", "")
    if chrom and not chrom.startswith("chr"):
        transformed["chromosome"] = f"chr{chrom}"

    transformed["classification"] = transform_clinvar_classification(
        transformed.get("classification")
    )

    return TransformedVariant(**transformed)
