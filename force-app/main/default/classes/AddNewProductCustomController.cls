/**
 * @description       : Controller for addNewProductCustom LWC Component. 
 *                      Used to fetch the products for lookup search based on the pricebook.
                        Fetch the products and show them in data table.
 *                      Modifying the line items through the datatable.
 * @author            : Cube84
 * @CreatedDate       : 07-10-2025
 * @last modified on  : 07-21-2025
 * @last modified by  : Cube84
 * @description       : Added the functionality to select the PriceBook for the Opportunity
**/
public with sharing class AddNewProductCustomController {
    public static final String DEFAULT_PRICE_BOOK_NAME = System.today().year() + ' Price Book';
    /**
        * @description: Used to fetch the products for lookup search based on the pricebook.
    **/
    @AuraEnabled(cacheable=false)
    public static List<Product2> searchProducts(String priceBookId, String keyword) {
        if (String.isBlank(keyword)) {
            return new List<Product2>();
        }
        String searchPattern = '%' + keyword + '%';

        Set<Id> prodIds = new Set<Id>();
        for (PricebookEntry pbe : [
            SELECT Id, Product2Id
            FROM PricebookEntry
            WHERE Pricebook2Id = :priceBookId
                AND IsActive = true WITH SECURITY_ENFORCED
        ]) {
            prodIds.add(pbe.Product2Id);
        }

        return [
            SELECT Id, Name
            FROM Product2
            WHERE Id IN :prodIds
                AND Name LIKE :searchPattern
                    AND IsActive = true WITH SECURITY_ENFORCED
            ORDER BY Name ASC
        ];
    }

    /**
        * @description: Used to fetch the products for data table based on the pricebook.
    **/
    @AuraEnabled(cacheable=false)
    public static String getInitDetails(String recordId, String productName) {
        Opportunity op = [
            SELECT Id, Pricebook2Id, Pricebook2.Name
            FROM Opportunity
            WHERE Id = :recordId
            WITH SECURITY_ENFORCED
        ];

        OpportunityProductWrapper opw = new OpportunityProductWrapper();
        opw.oppDetail = op;
        if(op.Pricebook2Id != null) {
            Map<Id, PricebookEntry> pbeMap = new Map<Id, PricebookEntry>();
            for (PricebookEntry pbe : [
                SELECT Id, UnitPrice, Product2Id
                FROM PricebookEntry
                WHERE Pricebook2Id = :op.Pricebook2Id
                    AND IsActive = true
                    AND Product2.IsActive = true
                    WITH SECURITY_ENFORCED
            ]) {
                pbeMap.put(pbe.Product2Id, pbe);
            }

            List<ProductWrapper> productWrappers = new List<ProductWrapper>();
            for (Product2 p : [
                SELECT Id, Name, ProductCode, Description,
                    On_Hold_Quantity__c, Total_Quantity__c
                FROM Product2
                WHERE Id IN :pbeMap.keySet()
                    AND Name LIKE :('%' + productName + '%')
                WITH SECURITY_ENFORCED
                ORDER BY Name ASC
            ]) {
                PricebookEntry pbe = pbeMap.get(p.Id) ?? null;
                ProductWrapper pw = new ProductWrapper();
                pw.pricebookEntryId = pbe?.Id;
                pw.unitPrice = pbe?.UnitPrice;
                pw.productUrl = '/lightning/r/Product2/' + p.Id + '/view';
                pw.Id = p.Id;
                pw.productId = p.Id;
                pw.name = p.Name;
                pw.productCode = p.ProductCode;
                pw.description = p.Description;
                pw.totalQuantity = p.Total_Quantity__c;
                pw.onHoldQuantity = p.On_Hold_Quantity__c;
                pw.totalPrice = 0;
                productWrappers.add(pw);
            }
            opw.productList = productWrappers;
        }
        else {
            opw.defaultPbId = [Select Id from PriceBook2 Where Name = :DEFAULT_PRICE_BOOK_NAME AND IsActive = true WITH SECURITY_ENFORCED limit 1] ?.Id;
        }
        return JSON.serialize(opw);
    }

    /**
        * @description: Modifying the line items through the datatable and save them in the DB.
    **/
    @AuraEnabled(cacheable=false)
    public static String saveProducts(String recordData, String recId) {
        List<ProductWrapper> wc = (List<ProductWrapper>)JSON.deserialize(recordData, List<ProductWrapper>.class);
        List<OpportunityLineItem> oliList = new List<OpportunityLineItem>();

        for (ProductWrapper pw : wc) {
            OpportunityLineItem oli = new OpportunityLineItem();
            oli.Quantity = pw.quantity;
            oli.UnitPrice = pw.unitPrice;
            oli.ServiceDate = pw.selectedDate;
            oli.Description = pw.lineDescription;
            oli.OpportunityId = recId;
            oli.Product2Id = pw.productId;
            oli.PricebookEntryId = pw.pricebookEntryId;
            oliList.add(oli);
        }

        try {
            if (Schema.sObjectType.OpportunityLineItem.isAccessible() && Schema.sObjectType.OpportunityLineItem.isCreateable()) {
                insert oliList;
            }
            return 'success';
        } catch (Exception e) {
            System.debug('Error inserting Oppty Products: ' + e.getMessage());
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    }

    public class OpportunityProductWrapper {
        public Opportunity oppDetail;
        public String defaultPbId;
        public List<ProductWrapper> productList;
    }

    public class ProductWrapper {
        public String Id;
        public String name;
        public String pricebookEntryId;
        public String productUrl;
        public String productId;
        public String productCode;

        public Decimal unitPrice;
        public Decimal quantity = 0;
        public Date selectedDate;
        public String description;
        public String lineDescription;

        public Decimal totalQuantity;
        public Decimal onHoldQuantity;

        public Decimal totalPrice;
    }

    /**
        * @description: Save PriceBook for the given Oppty
    **/
    @AuraEnabled(cacheable=false)
    public static String updatePBIdforOppty(String recordId, String priceBookId) {
        Opportunity opp = new Opportunity();
        opp.Id = recordId;
        opp.Pricebook2Id = priceBookId;
        try {
            if (Schema.sObjectType.Opportunity.isAccessible() && Schema.sObjectType.Opportunity.isUpdateable()) {
                update opp;
            }
            return 'Success';
        }
        catch (Exception e) {
            System.debug('Error updating Pricebook2Id: ' + e.getMessage());
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    }
}