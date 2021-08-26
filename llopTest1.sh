 #!/bin/bash 
         COUNTER=99999999999999999999999
         until [  $COUNTER -lt 10 ]; do
echo COUNTER $COUNTER
        curl http://localhost:8080/order/RefLab
        curl http://localhost:8080/order/IHD_Orders
        curl http://localhost:8080/order/VSS
        curl http://localhost:8080/order/VSS
        curl http://localhost:8080/order/other
        curl http://localhost:8080/order/other
        curl http://localhost:8080/order/RefLab
        curl http://localhost:8080/order/VSS
        curl http://localhost:8080/order/IHD_Orders
        curl http://localhost:8080/order/other

        COUNTER= COUNTER-1
 done
