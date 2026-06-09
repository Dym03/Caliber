
from django.core.management.base import BaseCommand

from apps.clinvar.services.parser import parse_clinvar_xml

class Command(BaseCommand):

    
    def handle(self, *args: tuple, **options: dict) -> None:
        # TODO 
        # 1. Download the latest ClinVar XML release from the NCBI FTP server (e.g., ftp://ftp.ncbi.nlm.nih.gov/pub/clinvar/xml/)
        # 2 Parse the XML file to extract relevant information about variants
        # 3 Sync the extracted data with the existing database, ensuring that new variants are added and existing variants are updated as necessary
        # 4. Handle any potential errors or inconsistencies in the data during the synchronization process
        # 5. Log the synchronization process for auditing and debugging purposes

        for variant in parse_clinvar_xml("data/clinvar_test.xml"):
            print(variant)

            
        
        