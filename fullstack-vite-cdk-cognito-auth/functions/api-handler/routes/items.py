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

dynamodb = boto3.resource("dynamodb")
ITEMS_TABLE_NAME = os.environ.get("ITEMS_TABLE_NAME")


class CreateItemRequest(BaseModel):
    name: str
    type: str
    status: str
    details: int


@router.get("/items")
@tracer.capture_method
def items():
    table = dynamodb.Table(ITEMS_TABLE_NAME)
    response = table.scan()
    items = response['Items']

    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response['Items'])

    return {"ok": True, "data": items}


@router.get("/items/<item_id>")
@tracer.capture_method
def get_item(item_id: str):
    table = dynamodb.Table(ITEMS_TABLE_NAME)

    response = table.get_item(
        Key={
            "itemId": item_id,
        }
    )

    item = response.get('Item', None)

    return {"ok": True, "data": item}


@router.put("/items")
@tracer.capture_method
def create_item():
    data: dict = router.current_event.json_body
    generic_request = CreateItemRequest(**data)

    item_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    table = dynamodb.Table(ITEMS_TABLE_NAME)

    response = table.put_item(Item={
        "itemId": item_id,
        "name": generic_request.name,
        "type": generic_request.type,
        "status": generic_request.status,
        "details": generic_request.details,
        "created_at": timestamp,
        "updated_at": timestamp
    })

    logger.info(response)

    return {"ok": True}


@router.delete("/items/<item_id>")
@tracer.capture_method
def delete_item(item_id: str):
    table = dynamodb.Table(ITEMS_TABLE_NAME)

    response = table.delete_item(
        Key={
            "itemId": item_id
        }
    )

    logger.info(response)

    return {"ok": True}
