
using { S_EVENT, S_EVENT_STATUS, S_EVENT_SERVICE_MAPPING, S_SERVICE_KAFKATOPIC_MAPPING } from '../db/schema';


service EventService {
    @readonly entity Events  as projection on S_EVENT;
    @readonly entity EventServiceMappings  as projection on S_EVENT_SERVICE_MAPPING;
    @readonly entity EventStatuses  as projection on S_EVENT_STATUS;

    function send() returns String;
    action setStatus(eventId: Integer, status:String); 
}