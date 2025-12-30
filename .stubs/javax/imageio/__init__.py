# Stub definitions for javax.imageio
# Location: stubs/javax/imageio.pyi

from typing import Any, List, Optional
from java.io import InputStream, OutputStream, File
from java.awt.image import BufferedImage

class ImageIO:
    @staticmethod
    def read(input: InputStream) -> Optional[BufferedImage]: ...

    @staticmethod
    def read(file: File) -> Optional[BufferedImage]: ...

    @staticmethod
    def write(
        im: BufferedImage, formatName: str, output: OutputStream
    ) -> bool: ...

    @staticmethod
    def write(
        im: BufferedImage, formatName: str, file: File
    ) -> bool: ...

    @staticmethod
    def getWriterFormatNames() -> List[str]: ...

    @staticmethod
    def getReaderFormatNames() -> List[str]: ...
