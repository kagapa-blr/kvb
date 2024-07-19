from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from starlette.responses import HTMLResponse

router = APIRouter()
templates = Jinja2Templates(directory='templates')

@router.get('/kavya', response_class=HTMLResponse)
async def kavya_page(request: Request):
    return templates.TemplateResponse('kavya.html', {'request': request})