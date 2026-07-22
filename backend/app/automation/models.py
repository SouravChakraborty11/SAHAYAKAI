from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from enum import Enum


class BrowserActionType(str, Enum):
    GOTO = "goto"
    CLICK = "click"
    FILL = "fill"
    SELECT = "select"
    SCREENSHOT = "screenshot"
    EXTRACT_FORM = "extract_form"
    WAIT = "wait"


@dataclass
class BrowserAction:
    """
    Represents a single browser action that can be executed.
    """

    action: BrowserActionType

    url: Optional[str] = None
    selector: Optional[str] = None
    value: Optional[str] = None

    timeout: int = 30000

    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class FormField:
    """
    Represents one detected form field.
    """

    label: str

    selector: str

    field_type: str

    required: bool = False

    placeholder: Optional[str] = None

    value: Optional[str] = None


@dataclass
class BrowserState:
    """
    Current browser information.
    """

    current_url: str = ""

    page_title: str = ""

    page_loaded: bool = False

    screenshot_path: Optional[str] = None


@dataclass
class BrowserResult:
    """
    Result returned after executing an action.
    """

    success: bool

    message: str

    data: Optional[Any] = None