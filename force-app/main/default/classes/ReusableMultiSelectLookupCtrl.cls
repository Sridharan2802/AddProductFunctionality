/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 07-15-2025
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public class ReusableMultiSelectLookupCtrl {

 @AuraEnabled(cacheable=true)
    public static List<sObject> retriveSearchData(String ObjectName, String fieldName, String value, List<String> selectedRecId,string queryCondition) {
        List<sObject> sObjectResultList = new List<sObject>();
        if(selectedRecId == null)
            selectedRecId = new List<String>();

        if(String.isNotEmpty(value)) {
            String query = 'Select '+fieldName+' FROM '+ObjectName+' WHERE Name LIKE \'%' + value.trim() + '%\'';
            if(queryCondition != ''){
                system.debug(queryCondition);
            string condition = ' and '+queryCondition;
            query = query+condition;
            }
            query = query+' and ID NOT IN: selectedRecId order by createdDate DESC LIMIT 5';
            system.debug(query);
            for(sObject so : Database.Query(query)) {
                sObjectResultList.add(so);
            }

        }
        else{

            String query = 'Select '+fieldName+' FROM '+ObjectName;
            if(queryCondition != ''){ 
                system.debug(queryCondition);
                string condition = ' where '+queryCondition+' and ID NOT IN: selectedRecId order by createdDate DESC LIMIT 6';
                query = query+condition;
            }
            else
            {
                query = query+' where ID NOT IN: selectedRecId order by createdDate DESC LIMIT 6';
            }
            system.debug(query);
            for(sObject so : Database.Query(query)) {
                sObjectResultList.add(so);
            }
        }
        return sObjectResultList;
    }
    @AuraEnabled(cacheable=true)
    public static opportunity getAccountData(Id recordId) {
       // return [SELECT Id, Boards__c FROM opportunity WHERE Id = :recordId LIMIT 1];
	   return null;
    }
    
     @AuraEnabled(cacheable=true)
    public static List<sObject> retriveMeetingComSearchData(String ObjectName, String fieldName, String value, List<String> selectedRecId) {
        List<sObject> sObjectResultList = new List<sObject>();
        if(selectedRecId == null)
            selectedRecId = new List<String>();

        if(String.isNotEmpty(value)) {
            String query = 'Select '+fieldName+' FROM '+ObjectName+' WHERE Name LIKE \'%' + value.trim() + '%\' and ID NOT IN: selectedRecId order by createdDate DESC LIMIT 5';
            for(sObject so : Database.Query(query)) {
                sObjectResultList.add(so);
            }

        }
        else{

             String query = 'Select '+fieldName+' FROM '+ObjectName+' order by createdDate DESC LIMIT 5';
            for(sObject so : Database.Query(query)) {
                sObjectResultList.add(so);
            }
        }
        return sObjectResultList;
    }
}
