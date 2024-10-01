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
