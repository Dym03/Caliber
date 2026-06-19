from django.core.management.base import BaseCommand, CommandError

from apps.clinvar.services.downloader import download_monthly_release
from apps.clinvar.services.importer import ClinVarBulkImporter
from apps.clinvar.services.parser import parse_clinvar_xml

import logging

from apps.clinvar.services.transformer import transform_clinvar_variant

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def handle(self, *args: tuple, **options: dict) -> None:
        # TODO
        # 1. Download the latest ClinVar XML release from the NCBI FTP server (e.g., ftp://ftp.ncbi.nlm.nih.gov/pub/clinvar/xml/)
        # 2 Parse the XML file to extract relevant information about variants
        # 3 Sync the extracted data with the existing database, ensuring that new variants are added and existing variants are updated as necessary
        # 4. Handle any potential errors or inconsistencies in the data during the synchronization process
        # 5. Log the synchronization process for auditing and debugging purposes
        importer = ClinVarBulkImporter(batch_size=10000)

        parsed_counter = 0
        try:
            logger.info("Starting ClinVar synchronization process...")
            download_monthly_release()
            logger.info(
                "Download complete. Beginning XML parsing and database synchronization..."
            )

            # Streams elements row-by-row utilizing our generator pipeline
            for variant in parse_clinvar_xml():
                variant = transform_clinvar_variant(
                    variant
                )  # Optional: Apply any necessary transformations to the parsed data before importing
                # --- TODO 4: Handle inconsistencies/errors ---
                # The importer internal pipeline safely discards records missing
                # vital physical chromosome coordinates or matching gene mappings.
                importer.add_variant(variant)

                parsed_counter += 1
                if parsed_counter % 25000 == 0:
                    logger.info(f"Parsed and validated {parsed_counter} records...")

            # Clean any remaining data packets left inside the ingestion queue array
            importer.flush()

            # --- TODO 5: Log the synchronization process for auditing ---
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully sync'd {parsed_counter} variants with core schema."
                )
            )
            logger.info(
                f"ClinVar synchronization finished successfully. Processed {parsed_counter} items."
            )

        except Exception as e:
            # Global execution safety net wrap
            logger.critical(
                f"Pipeline crashed during streaming ingestion phase: {str(e)}",
                exc_info=True,
            )
            self.stderr.write(self.style.ERROR(f"Critical execution error: {str(e)}"))
            raise CommandError(
                "Sync script aborted due to unhandled pipeline exception."
            )
