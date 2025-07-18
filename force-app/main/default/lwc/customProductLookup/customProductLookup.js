import { LightningElement, track, api } from 'lwc';
import searchProducts from '@salesforce/apex/customproductController.searchProducts';

export default class CustomProductLookup extends LightningElement {
    @api pbId;
    @track searchKey = '';
    @track searchResults = [];
    @track selectedProduct = null;
    @track showDropdown = false;
    @track noResults = false;

    get comboboxClass() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${this.showDropdown ? 'slds-is-open' : ''}`;
    }

    handleSearchInput(event) {
        console.log('<<handleSearchInput>>'+event.target.value);
        this.searchKey = event.target.value;
        this.performSearch();
        if(this.searchKey == '') {
            const searchEvent = new CustomEvent('productsearch', {
                detail: {
                    type: 'text',
                    key: this.searchKey
                }
            });
            this.dispatchEvent(searchEvent);
        }
    }

    handleKeyUp(event) {
        const isEnterKey = event.key === 'Enter';
        if (isEnterKey) {
            console.log('<<handleKeyUp>>' + isEnterKey + '<<Search Key>>' + this.searchKey);
            this.showDropdown = false;
            const searchEvent = new CustomEvent('productsearch', {
                detail: {
                    type: 'text',
                    key: this.searchKey
                }
            });
            this.dispatchEvent(searchEvent);
        }
    }

    performSearch() {
        console.log('Performing search with keyword:', this.searchKey, ' and Price Book ID:', this.pbId);
        if (!this.searchKey || this.searchKey.trim() === '') {
            this.searchResults = [];
            this.noResults = false;
            this.showDropdown = false;
            return;
        }
        searchProducts({ 
            priceBookId: this.pbId,
            keyword: this.searchKey
         })
            .then((result) => {
                this.searchResults = result;
                this.noResults = result.length === 0;
                this.showDropdown = true;
            })
            .catch((error) => {
                console.error('Error in product lookup:', error);
                this.searchResults = [];
                this.noResults = true;
                this.showDropdown = true;
            });
    }

    handleSelect(event) {
        const productId = event.currentTarget.dataset.id;
        const productName = event.currentTarget.dataset.name;
        this.selectedProduct = {
            Id: productId,
            Name: productName
        };
        this.searchResults = [];
        this.searchKey = '';
        this.showDropdown = false;
        const selectedEvent = new CustomEvent('productsearch', {
            detail: {
                type: 'id',
                key: this.selectedProduct.Id
            }
        });
        this.dispatchEvent(selectedEvent);
    }

    clearSelection() {
        const clearedId = this.selectedProduct?.Id;
        this.selectedProduct = null;
        this.searchKey = '';
        this.searchResults = [];
        const clearEvent = new CustomEvent('clearproduct', {
            detail: { productId: clearedId }
        });
        this.dispatchEvent(clearEvent);
    }
}