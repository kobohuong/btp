entity Table01 {
    key ID : String;
    name : String;
}


@cds.persistence.exists 
Entity ![S_EVENT] {
key     ![EVENT_ID]: Integer  @title: 'EVENT_ID' ; 
key     ![EVENT]: String(20)  @title: 'EVENT' ; 
key     ![KEY]: String(40)  @title: 'KEY' ; 
        ![DELIVERED_COMPLETE]: Boolean  @title: 'DELIVERED_COMPLETE' ; 
        ![PRIORITY]: String(1)  @title: 'PRIORITY' ; 
        ![STATUS]: String(5)  @title: 'STATUS' ; 
        ![CREATION_TS]: Timestamp  @title: 'CREATION_TS' ; 
        ![DELIVERY_TS]: Timestamp  @title: 'DELIVERY_TS' ; 
        ![EARLIEST_DELIVERY_TS]: Timestamp  @title: 'EARLIEST_DELIVERY_TS' ; 
        ![MODIFICATION]: String(1)  @title: 'MODIFICATION' ; 
}

@cds.persistence.exists 
Entity ![S_EVENT_STATUS] {
key     ![EVENT]: String(20)  @title: 'EVENT' ; 
key     ![SERVICE]: String(20)  @title: 'SERVICE' ; 
key     ![KEY]: String(40)  @title: 'KEY' ; 
        ![STATUS]: String(5)  @title: 'STATUS' ; 
        ![LAST_STATUS]: String(5)  @title: 'LAST_STATUS' ; 
        ![EVENT_ID]: Integer  @title: 'EVENT_ID' ; 
        ![LAST_EVENT_ID]: Integer  @title: 'LAST_EVENT_ID' ; 
        ![DELIVERY_TS]: Timestamp  @title: 'DELIVERY_TS' ; 
        ![LAST_DELIVERY_TS]: Timestamp  @title: 'LAST_DELIVERY_TS' ; 
        ![DELIVERED]: Boolean  @title: 'DELIVERED' ; 
        ![LAST_DELIVERED]: Boolean  @title: 'LAST_DELIVERED' ; 
        ![MODIFICATION]: String(1)  @title: 'MODIFICATION' ; 
        ![LAST_MODIFICATION]: String(1)  @title: 'LAST_MODIFICATION' ; 
        ![ERROR_MSG]: String(100)  @title: 'ERROR_MSG' ; 
        ![LAST_ERROR_MSG]: String(100)  @title: 'LAST_ERROR_MSG' ; 
}

@cds.persistence.exists 
Entity ![S_EVENT_SERVICE_MAPPING] {
key     ![ID]: Integer  @title: 'ID' ; 
        ![EVENT]: String(20)  @title: 'EVENT' ; 
        ![SERVICE]: String(40)  @title: 'SERVICE' ; 
        ![STATUS]: String(4)  @title: 'STATUS' ; 
}

@cds.persistence.exists 
Entity ![S_SERVICE_KAFKATOPIC_MAPPING] {
key     ![ID]: Integer  @title: 'ID' ; 
        ![SERVICE]: String(40)  @title: 'SERVICE' ; 
        ![TOPIC]: String(40)  @title: 'TOPIC' ; 
        ![STATUS]: String(4)  @title: 'STATUS' ; 
}