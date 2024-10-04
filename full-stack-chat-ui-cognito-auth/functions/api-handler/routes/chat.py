import os
import uuid
import boto3
from datetime import datetime
from pydantic import BaseModel
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler.api_gateway import Router

tracer = Tracer()
router = Router()
logger = Logger()



@router.post("/chat")
@tracer.capture_method
def chat():
    data: dict = router.current_event.json_body

    logger.info(data)

    return {"ok": True, "response":data}
