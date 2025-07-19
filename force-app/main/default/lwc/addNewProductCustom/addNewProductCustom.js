/**
 * @description       : Used to fetch the products for lookup search based on the pricebook.
                        Fetch the products and show them in data table.
 *                      Modifying the line items through the datatable.
 * @author            : Cube84
 * @CreatedDate       : 07-10-2025
 * @last modified on  : 07-18-2025
 * @last modified by  : Optimized for performance and readability.
**/
import { LightningElement, track, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { CloseActionScreenEvent } from 'lightning/actions';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getInitDetails from '@salesforce/apex/AddNewProductCustomController.getInitDetails';
import saveProducts from '@salesforce/apex/AddNewProductCustomController.saveProducts';

import { loadStyle } from 'lightning/platformResourceLoader';
import modalOverride from '@salesforce/resourceUrl/ModalOverride';

// Table 1 Columns
const COLUMN_PAGE1 = [
    {
        label: 'Product Name',
        fieldName: 'productUrl',
        type: 'url',
        typeAttributes: { label: { fieldName: 'name' } }
    },
    { label: 'List Price', fieldName: 'unitPrice', type: 'currency' },
    { label: 'Product Description', fieldName: 'description', type: 'text' }
];

// Table 2 Columns
const COLUMN_PAGE2 = [
    {
        label: 'Product Name',
        fieldName: 'productUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'name' },
            target: '_blank'
        },
        initialWidth: 250
    },
    {
        label: 'Quantity',
        fieldName: 'quantity',
        type: 'number',
        editable: true,
        initialWidth: 100
    },
    {
        label: 'List Price',
        fieldName: 'unitPrice',
        type: 'customEditable',
        typeAttributes: { isCurrency: true },
        editable: false,
        initialWidth: 100
    },
    {
        label: 'Sales Price',
        fieldName: 'unitPrice',
        type: 'customEditable',
        typeAttributes: { isCurrency: true },
        editable: true,
        initialWidth: 150
    },
    {
        label: 'Date',
        fieldName: 'selectedDate',
        type: 'date-local',
        editable: true,
        typeAttributes: {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            timeZone: 'UTC' // Optional: prevents time shift
        },
        initialWidth: 100
    },
    {
        label: 'Line Description',
        fieldName: 'lineDescription',
        type: 'text',
        editable: true,
        initialWidth: 150
    },
    {
        label: 'Total Price',
        fieldName: 'totalPrice',
        type: 'currency',
        editable: false,
        initialWidth: 150
    },
    {
        label: 'Total Quantity',
        fieldName: 'totalQuantity',
        type: 'decimal',
        editable: false,
        initialWidth: 150
    },
    {
        label: 'On Hold Quantity',
        fieldName: 'onHoldQuantity',
        type: 'decimal',
        editable: false,
        initialWidth: 150
    },
    {
        type: 'button-icon',
        fixedWidth: 50,
        typeAttributes: {
            iconName: 'utility:delete',
            name: 'delete',
            title: 'Delete',
            variant: 'bare'
        }
    }
];

export default class AddNewProductCustom extends NavigationMixin(LightningElement) {
    // Variable declration
    columnPage1 = COLUMN_PAGE1;
    columnPage2 = COLUMN_PAGE2;
    @api recordId;
    selectedRecordCount = 0;
    showSelected = true;
    showTableData = [];
    selectedProductCode = [];
    allProductData = [];
    selectedProductData = [];
    selectedRows = [];
    showViewAll = false;
    isProductSelect = true;
    isFirstPage = true;
    isSecondPage = false;
    disableNext = true;
    showErrorMsg = false;
    draftValues = []; // Holds draft values for the datatable 2 based on the inline changes
    selectedRecords = []; // Holds selected products
    searchTerm = ''; // Received from customProductLookup
    selectedId = ''; // Received from customProductLookup
    filteredProductList = [];
    allProductList = []; // Acts as a backup list
    selectedProductIds = []; // Holds selected product Ids
    isSRLoaded = false; // Flag to check if the Static Resource is loaded or not

    // To read the recordId from the URL for Custom Action Button
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.recordId = currentPageReference.state.recordId;
            console.log('recordId from URL:', this.recordId);
            this.loadInitialData();
        }
    }

    renderedCallback() {
        if(this.isSRLoaded) {
            return;
        }
        loadStyle(this, modalOverride)
        .then(() => {
            console.log('Modal style loaded Sucecssfully');
            this.isSRLoaded = true;
        })
        .catch(error => {
            console.error('Failed to load modal style', error);
        });
    }

    // Fecth initial data when the component is loaded with the PriceBook details and Product list
    loadInitialData() {
        console.log('<<recordId>>' + this.recordId);
        getInitDetails({ recordId: this.recordId, productName: this.searchTerm })
            .then(result => {
                const dataObj = JSON.parse(result);
                this.priceBookName = dataObj.oppDetail.Pricebook2.Name;
                this.priceBookId = dataObj.oppDetail.Pricebook2Id;
                this.allProductData = dataObj.productList;
                this.showTableData = dataObj.productList;
                console.log('allProductData' + JSON.stringify(this.allProductData));
            })
            .catch(error => {
                console.error('Error loading initial products', error);
            });
    }

    // Handle product search event from customProductLookup component
    handleProductSearch(event) {
        console.log('<<handleProductSearch 1>>'+ JSON.stringify(event.detail));
        const detail = event.detail;
         if (detail?.type === 'id') {
            this.searchTerm = '';
            this.selectedId = detail.key;
            this.searchTerm = null;
        } 
        else { // type === 'text'
            this.searchTerm = detail.key.trim();
            this.selectedId = null;
        } 

        let filteredProdList = [...this.allProductData];
        let filteredProdListOrder1 = [];
        let filteredProdListOrder2 = [];
        let filteredProdListSorted = [];

        if(this.selectedId) {
            filteredProdListOrder1 = filteredProdList.filter(prod => (prod.productId == this.selectedId));
            filteredProdListOrder2 = filteredProdList.filter(prod2 => (prod2.productId != this.selectedId));
        }
        else if (this.searchTerm != '') {
            console.log('<<searchTerm>>'+this.searchTerm);
            const searchLower = this.searchTerm.toLowerCase();
            filteredProdListOrder1 = filteredProdList.filter(prod =>
               prod.name.toLowerCase().includes(searchLower)
            );
            filteredProdListOrder2 = filteredProdList.filter(prod2 =>
                !prod2.name.toLowerCase().includes(searchLower)
            );
        }
        else {
            console.log('<<searchTerm Else>>'+this.searchTerm);
            filteredProdListOrder1 = filteredProdList;
        }
        filteredProdListSorted.push(...filteredProdListOrder1, ...filteredProdListOrder2);
        this.showTableData = filteredProdListSorted;
    }

    // Handle clear product event from customProductLookup component
    handleClearProduct(event) {
        console.log('<<handleClearProduct>>');
        this.searchTerm = '';
        this.showTableData = this.allProductData;
    }

    // Displays "Show Slected" products view
    handleShowSelected() {
        this.showSelected = false;
        this.showViewAll = true;
        let filtered = [...this.allProductData];
        filtered = filtered.filter(prod =>
            this.selectedProductIds.includes(prod.Id)
        );
        this.showTableData = filtered;
    }

     // Displays "Back to Result" products view
    handleViewAll() {
        this.showSelected = true;
        this.showViewAll = false;
        this.showTableData = this.allProductData;
    }

    // Handles products selected from Table 1
    handleSelectedProduct(event) {
        const selectedRows = event.detail.selectedRows;
        let selectedProductIdsTemp = [];
        selectedProductIdsTemp = selectedRows.map(row => row.productId);
        this.selectedProductIds = selectedProductIdsTemp;
        console.log('<<selectedProductIds>>'+JSON.stringify(this.selectedProductIds));
        const selectedIdSet = new Set(this.selectedProductIds);
        this.selectedProductData = this.allProductData.filter(product =>
            selectedIdSet.has(product.productId)
        );

        this.selectedRecordCount = this.selectedProductIds.length;
        this.disableNext = this.selectedRecordCount <= 0;
        this.isProductSelect = true;
    }

    // Handle close modal event
    closeModal() {
        this.dispatchEvent(new CloseActionScreenEvent());
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Opportunity',
                actionName: 'view',
            },
        }, true);
    }

    // Displays Next page
    handleNext() {
        this.isFirstPage = false;
        this.isSecondPage = true;
        let filtered = [...this.allProductData];
        filtered = filtered.filter(prod =>
            this.selectedProductIds.includes(prod.Id)
        );
        this.selectedProductData = filtered;
    }
    
    // Displays previous page
    handleback() {
        this.isFirstPage = true;
        this.isSecondPage = false;
        this.showTableData = this.allProductData;
        this.showSelected = true;
        this.showViewAll = false;
    }

    // Handles inline button clicks from Table 2
    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;

        if (action.name === 'delete') {
            this.selectedProductData = this.selectedProductData.filter(
                item => item.Id !== row.Id
            );
            this.selectedProductIds = this.selectedProductIds.filter(
                prodId => prodId != row.Id
            );
            this.selectedRecordCount = this.selectedProductIds.length;
        }
    }

    // Validates if there are any issues and sends it to the apex for saving
    handleSave() {
        let errorMessage = '';
        let errorMessageList = [];
        let datatable = this.template.querySelector('lightning-datatable');
        let drafts = datatable.draftValues || [];
        console.log('<<draft>>' + JSON.stringify(drafts));
        drafts.forEach(draft => {
            let product = this.selectedProductData.find(p => p.Id === draft.Id);
            if(product) {
                Object.assign(product, draft);
            }
        });
        console.log('<<draft selectedProductData>>' + JSON.stringify(this.selectedProductData));

        this.selectedProductData.forEach(product => {
            console.log('<<product>>' + JSON.stringify(product));
            if (!product.quantity || product.quantity < 1) {
                errorMessage = `${product.name}: Qty cannot be 0`;
            }
            else if (product.totalQuantity && product.quantity > product.totalQuantity) {
                errorMessage = `${product.name}: Qty should be within ${product.totalQuantity}`;
            }
            if(errorMessage != '') {
                errorMessageList.push(errorMessage);
                errorMessage = ''; // Reset for next iteration
            }
        });
        console.log('<<errorMessageList>>' + JSON.stringify(errorMessageList));
        if (errorMessageList.length === 0) {
            let selectedProductDataStr = JSON.stringify(this.selectedProductData);
            saveProducts({ recordData: selectedProductDataStr, recId: this.recordId })
                .then(result => {
                    this.showToastMethod('Success','Products added successfully','success');
                    this.closeModal();
                })
                .catch(error => {
                    const errorMsg = error?.body?.message || error?.message || 'Unknown error occurred';
                    this.showToastMethod('Error',errorMsg,'error');
                    this.closeModal();
                });
        } else {
            this.showToastMethod('Error',errorMessageList.join('; '),'error');
        }
    }

    // Utility function to show toast messages
    showToastMethod(titleStr, msgStr, variantStr) {
        this.dispatchEvent(new ShowToastEvent({
            title: titleStr,
            message: msgStr,
            variant: variantStr
        }));
    }
}