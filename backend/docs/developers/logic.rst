.. _developers_logic:


Processing a review
===================

After a reviewer has reviewed a destruction list, the record manager needs to process the feedback.
For each zaak that has been "rejected" by the reviewer, the record manager can:

- Keep the zaak in the destruction list (go against the suggestion of the reviewer). In this case, no details of the zaak can be updated.
- Remove the zaak from the destruction list. When removing the zaak, the record manager should either:

   - Update the selectielijstklasse of the zaak. 

     This should automatically update the archiefactiedatum of the zaak (this is currently done by the frontend). 
     *Example*: case where the zaak has the wrong selectielijstklasse by accident. 

     The record manager needs to still be able to update the archiefactiedatum manually. 

     In the case where the selectielijstklasse has "waardering" equal to "blijven_bewaren", 
     then the archiefactiedatum must be empty and the record manager cannot change it.
   
   - Update the archiefactiedatum of the zaak. 

     In this case the selectielijstklasse is correct, but for whatever reason the zaak needs to be kept for longer. 
     Changing the archiefactiedatum for zaken with "waardering" equal to "blijven_bewaren" should not be possible.

Selectielijst
=============

Some aspects about the selectielijst resources that can be confusing:

- Each zaaktype has an associated selectielijstprocestype (a URL to a resource in the https://selectielijst.openzaak.nl/api/v1/procestypen API).
  The procestype has a year associated to it, which is the version of the selectielijst.
- Each zaak has an associated selectielijstklasse (a URL to a resource in the https://selectielijst.openzaak.nl/api/v1/resultaten API).
  Each selectielijstklasse is associated with a selectielijstprocestype. 
  The zaak can only be related to a selectielijstklasse whose procestype matches the procestype related to the zaaktype 
  of the zaak.