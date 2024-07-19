from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from starlette.responses import HTMLResponse

router = APIRouter()
templates = Jinja2Templates(directory='templates')
@router.get('/prastavane', response_class=HTMLResponse)
async def prastavane_page(request: Request):
    return templates.TemplateResponse('prastavane.html', {'request': request})