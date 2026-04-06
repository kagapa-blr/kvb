import logging
import os
import inspect
from datetime import datetime


def get_logger(logger_name: str | None = None,
               log_dir: str = "logs") -> logging.Logger:
    """
    Create and return a named logger.

    Features:
    - Creates logs directory if not present
    - Creates daily log file (YYYY-MM-DD.log)
    - Uses provided logger name
    - If logger_name is None, uses caller file name
    - Prevents duplicate handlers
    - Console + file logging
    """

    # Automatically detect caller file name
    if not logger_name:
        frame = inspect.stack()[1]
        module = inspect.getmodule(frame[0])

        if module and module.__file__:
            logger_name = os.path.splitext(
                os.path.basename(module.__file__)
            )[0]
        else:
            logger_name = "unknown"

    # Ensure logs directory exists
    os.makedirs(log_dir, exist_ok=True)

    # Daily log file
    today = datetime.now().strftime("%d-%m-%Y")
    log_filename = f"{today}.log"
    log_path = os.path.join(log_dir, log_filename)

    # Get named logger
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)

    # Prevent duplicate propagation
    logger.propagate = False

    # Prevent duplicate handlers
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # File handler
    file_handler = logging.FileHandler(
        log_path,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger
