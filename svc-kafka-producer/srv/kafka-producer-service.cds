using de.barmer.kafka.producer as my from '../db/data-model';
using RemoteKafka as kafka from  './external/RemoteKafka.cds';

service KafkaSenderService @(path: 'kafka-producer') {
    @readonly entity Books as projection on my.Books;
    action callKafka(id: String, payload: String) returns { message : String };   
}