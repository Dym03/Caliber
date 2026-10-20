import re
from enum import Enum


class ClassificationEnum(Enum):
    PATHOGENIC = "Pathogenic"
    PATHOGENIC_LIKELY_PATHOGENIC = "Pathogenic/Likely pathogenic"
    LIKELY_PATHOGENIC = "Likely pathogenic"
    UNCERTAIN_SIGNIFICANCE_LIKELY_PATHOGENIC = "Uncertain significance/Likely pathogenic"
    UNCERTAIN_SIGNIFICANCE = "Uncertain significance"
    LIKELY_BENIGN_UNCERTAIN_SIGNIFICANCE = "Likely benign/Uncertain significance"
    LIKELY_BENIGN = "Likely benign"
    BENIGN_LIKELY_BENIGN = "Benign/Likely benign"
    BENIGN = "Benign"
    ARTEFACT = "Artefact"
    HYPOMORF_VARIANT = "Hypomorph variant"
    PHARMACO_RISK_FACTOR = "Pharmaco risk factor"
    SOMATIC = "Somatic"

    @classmethod
    def from_clinvar_string(cls, value: str | None) -> "ClassificationEnum":
        """
        Parses high-frequency exact matches instantly, then routes complex
        compound terms through fallback logic. Safe for millions of rows.
        """
        if not value:
            return cls.UNCERTAIN_SIGNIFICANCE

        norm = value.strip().lower()

        # Step 1: O(1) Fast path for the top 99% of variants
        if norm in cls._DIRECT_MAP:
            return cls._DIRECT_MAP[norm]

        # Step 2: Fallback logic for compound strings / low penetrance tail

        # Unify conflicting classifications or explicit unprovided statuses
        if (
            "conflict" in norm
            or "not provided" in norm
            or "no classification" in norm
            or "[missing" in norm
        ):
            return cls.UNCERTAIN_SIGNIFICANCE

        # Handle combinations of pathogenic variants
        if "pathogenic" in norm:
            if "likely" in norm and "pathogenic/likely" not in norm:
                return cls.LIKELY_PATHOGENIC
            if "likely" in norm and "pathogenic/likely" in norm:
                return cls.PATHOGENIC_LIKELY_PATHOGENIC
            return cls.PATHOGENIC

        # Handle combinations of benign variants
        if "benign" in norm:
            if "uncertain" in norm:
                return cls.LIKELY_BENIGN_UNCERTAIN_SIGNIFICANCE
            if "likely" in norm and "benign/likely" not in norm:
                return cls.LIKELY_BENIGN
            if "likely" in norm and "benign/likely" in norm:
                return cls.BENIGN_LIKELY_BENIGN
            return cls.BENIGN

        # Explicit custom ClinVar sub-tiers (VUS-high, VUS-mid, VUS-low)
        if "vus" in norm:
            return cls.UNCERTAIN_SIGNIFICANCE

        # Default fallback for everything else (drug response, risk factor, modifiers)
        return cls.UNCERTAIN_SIGNIFICANCE

    @classmethod
    def from_excel_string(cls, value: str | None) -> "ClassificationEnum":
        if not value:
            return cls.UNCERTAIN_SIGNIFICANCE
        norm = value.strip()
        return cls._EXCEL_MAP.get(norm, cls.UNCERTAIN_SIGNIFICANCE)

    @property
    def score(self) -> float:
        """Returns the numeric float score of the enum instance."""
        return self._SCORES.get(self, 3.0)


ClassificationEnum._DIRECT_MAP = {
    "uncertain significance": ClassificationEnum.UNCERTAIN_SIGNIFICANCE,
    "likely benign": ClassificationEnum.LIKELY_BENIGN,
    "[missing / no assertion provided]": ClassificationEnum.UNCERTAIN_SIGNIFICANCE,
    "benign": ClassificationEnum.BENIGN,
    "pathogenic": ClassificationEnum.PATHOGENIC,
    "likely pathogenic": ClassificationEnum.LIKELY_PATHOGENIC,
    "conflicting classifications of pathogenicity": ClassificationEnum.UNCERTAIN_SIGNIFICANCE,
    "benign/likely benign": ClassificationEnum.BENIGN_LIKELY_BENIGN,
    "pathogenic/likely pathogenic": ClassificationEnum.PATHOGENIC_LIKELY_PATHOGENIC,
    "not provided": ClassificationEnum.UNCERTAIN_SIGNIFICANCE,
    "artefact": ClassificationEnum.ARTEFACT,
    "hypomorph variant": ClassificationEnum.HYPOMORF_VARIANT,
    "pharmaco risk factor": ClassificationEnum.PHARMACO_RISK_FACTOR,
    "somatic": ClassificationEnum.SOMATIC,
}

ClassificationEnum._EXCEL_MAP = {
    "8": ClassificationEnum.SOMATIC,
    "7": ClassificationEnum.PHARMACO_RISK_FACTOR,
    "6": ClassificationEnum.HYPOMORF_VARIANT,
    "5": ClassificationEnum.PATHOGENIC,
    "4-5": ClassificationEnum.PATHOGENIC_LIKELY_PATHOGENIC,
    "4": ClassificationEnum.LIKELY_PATHOGENIC,
    "3-4": ClassificationEnum.UNCERTAIN_SIGNIFICANCE_LIKELY_PATHOGENIC,
    "3": ClassificationEnum.UNCERTAIN_SIGNIFICANCE,
    "2-3": ClassificationEnum.LIKELY_BENIGN_UNCERTAIN_SIGNIFICANCE,
    "2": ClassificationEnum.LIKELY_BENIGN,
    "1-2": ClassificationEnum.BENIGN_LIKELY_BENIGN,
    "1": ClassificationEnum.BENIGN,
    "0": ClassificationEnum.ARTEFACT,
}

ClassificationEnum._CLASSIFICATION_SCORE_TO_STRING = {
    8.0: "8",
    7.0: "7",
    6.0: "6",
    5.0: "5",
    4.5: "4-5",
    4.0: "4",
    3.5: "3-4",
    3.0: "3",
    2.5: "2-3",
    2.0: "2",
    1.5: "1-2",
    1.0: "1",
    0.0: "0",
}

ClassificationEnum._SCORES = {
    ClassificationEnum.SOMATIC: 8.0,
    ClassificationEnum.PHARMACO_RISK_FACTOR: 7.0,
    ClassificationEnum.HYPOMORF_VARIANT: 6.0,
    ClassificationEnum.PATHOGENIC: 5.0,
    ClassificationEnum.PATHOGENIC_LIKELY_PATHOGENIC: 4.5,
    ClassificationEnum.LIKELY_PATHOGENIC: 4.0,
    ClassificationEnum.UNCERTAIN_SIGNIFICANCE_LIKELY_PATHOGENIC: 3.5,
    ClassificationEnum.UNCERTAIN_SIGNIFICANCE: 3.0,
    ClassificationEnum.LIKELY_BENIGN_UNCERTAIN_SIGNIFICANCE: 2.5,
    ClassificationEnum.LIKELY_BENIGN : 2.0,
    ClassificationEnum.BENIGN_LIKELY_BENIGN: 1.5,
    ClassificationEnum.BENIGN: 1.0,
    ClassificationEnum.ARTEFACT : 0.0,
}
