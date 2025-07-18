import { LightningElement, api,wire ,track } from 'lwc';
import getOpportunityData from '@salesforce/apex/ReusableMultiSelectLookupCtrl.getAccountData';
import retriveSearchData from '@salesforce/apex/ReusableMultiSelectLookupCtrl.retriveSearchData';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ReuseableMultipickList extends LightningElement {
    @api objectname = '';
    @api fieldnames = ' Id, Name ';
    @api queryCondition = '';
    @api Label;
    @track searchRecords = [];
    @track selectedRecords = [];
    @api iconName = 'standard:account'
    @track messageFlag = false;
    @track isSearchLoading = false;
    @api placeholder = 'Search..';
    @track searchKey;
    delayTimeout;
    @api allowmultiple = 'true';  // To make this comp as multi select 
    @api aftersubmit = false;
    @api searchlimit ;
    @api searchname;
@api showallrecoption;
@api isselectedall=false;
    //newly added
    @api recordId;

    @track opportunity; // Store the opportunity data
    @track stropportunity;
    @track boardName;
    @track boardNames;
    @api clearPillsOnly() {
    this.selectedRecords = [];
   
    
}

    @wire(getOpportunityData, { recordId: '$recordId' })
    wiredOpportunity({ error, data }) {
        if (data) {
            this.opportunity = data;
            console.log('this.opportunity '+JSON.stringify(this.opportunity));
this.stropportunity=JSON.stringify(this.opportunity);
console.log('this.stropportunity '+this.stropportunity);

//this.boardName = this.stropportunity.match(/>([^<]+)<\/a>/g).map(name => name.replace(/<\/?a>/g, '')).join(',');
this.boardName = this.stropportunity
    .match(/>([^<]+)<\/a>/g) // Matches the board names within <a> tags
    .map(name => name.slice(1, -4)); // Removes the `>` at the start and `</a>` at the end
    //.join(',');


const boardNames = this.stropportunity
    .match(/>([^<]+)<\/a>/g) // Matches the board names within <a> tags
    .map(name => name.slice(1, -4));
    this.selectedRecords = boardNames.map(name => ({ Name: name }));
console.log('sel'+this.selectedRecords);
console.log('sel'+JSON.stringify(this.selectedRecords)); // Outputs an array of objects with board names

//newly addded


//this.stropportunity.match(/>([^<]+)<\/a>/g).map(name => name.replace(/<\/?a>/g, ''));

            //const bb =this.boardNameArray.join(',');
            //console.log('bb'+bb);


console.log('boardName'+this.boardName);
this.boardNames = this.boardName ? this.boardName[1] : null;
 console.log('boardNames'+this.boardNames);

            this.initializeSelectedRecords(); // Initialize records once data is available
        } else if (error) {
            console.error(error);
        }
    }

    get boards() {
        return this.opportunity ? this.opportunity.Boards__c : '';
    }

    connectedCallback() {
        // Ensure that the opportunity data is loaded
        if (this.opportunity) {
            this.initializeSelectedRecords();
        }
        console.log('allowmultiple',this.allowmultiple);
        console.log('searchlimit',this.searchlimit);
    }

    initializeSelectedRecords() {
        // Ensure the record data is loaded before accessing the name
        if (this.opportunity && this.opportunity.Boards__c) {
            ////const recordName = this.boardName; // Using the getter directly
            //this.selectedRecords = [{ Name: recordName }];
            
            // Dispatch the selected event with the updated selectedRecords
            const selectedEvent = new CustomEvent('selected', {
                detail: { selRecords: this.selectedRecords }
            });
            this.dispatchEvent(selectedEvent);
        }
    }

    /*initializeSelectedRecords() {
        if (this.preselectedBoards && this.preselectedBoards.length > 0) {
            this.selectedRecords = [...this.preselectedBoards];
            const selectedEvent = new CustomEvent('selected', { detail: { selRecords: this.selectedRecords } });
            this.dispatchEvent(selectedEvent);
        }
    }*/

    searchField() {



        var selectedRecordIds = [];
        this.selectedRecords.forEach(ele=>{
            selectedRecordIds.push(ele.Id);
        })
        console.log('this.selectedRecords length:', this.selectedRecords.length);
        console.log('allowmultiple',this.allowmultiple);
        console.log('isselectedall',this.isselectedall);
         console.log('(this.showallrecoption',(this.showallrecoption == 'true'));
        if((this.allowmultiple == 'false') && (this.selectedRecords.length == 1))
        {
console.log('single select lookup enabled');
const lookupInputContainer = this.template.querySelector('.lookupInputContainer');
const clsList = lookupInputContainer.classList;
clsList.remove('slds-is-open');

        }
        else if((this.allowmultiple == 'true') && (this.selectedRecords.length == this.searchlimit))
        {
console.log('Multi select with search limit lookup enabled');
        this.showAlert(`You Can Select only ${this.searchlimit} ${this.searchname}`,'Warning','Warning');        

const lookupInputContainer = this.template.querySelector('.lookupInputContainer');
const clsList = lookupInputContainer.classList;
clsList.remove('slds-is-open');
        }
         else if((this.showallrecoption == 'true') && (this.isselectedall))
        {

const lookupInputContainer = this.template.querySelector('.lookupInputContainer');
const clsList = lookupInputContainer.classList;
clsList.remove('slds-is-open');
        }
        else if(this.aftersubmit == true)
        {
            console.log('after submit you cannot edit or add');

const lookupInputContainer = this.template.querySelector('.lookupInputContainer');
const clsList = lookupInputContainer.classList;
clsList.remove('slds-is-open');
        }
        else
        {

        retriveSearchData({ ObjectName: this.objectname, fieldName: this.fieldnames, value: this.searchKey, selectedRecId: selectedRecordIds, queryCondition : this.queryCondition })
            .then(result => {
                        console.log('1111searchKey');
                        if(this.showallrecoption == 'true')
                        {
                if(this.selectedRecords.length == 0)
                {
                 const allOption = {
            Id: 'ALL',
            Name: 'All'+this.searchname,
            Active__c: true
        };

        this.searchRecords = [allOption, ...result];
                }
                else
                {
                 this.searchRecords = result;

                }
                        }
                        else
                        {
                             this.searchRecords = result;
                        }
                this.isSearchLoading = false;
                const lookupInputContainer = this.template.querySelector('.lookupInputContainer');
                const clsList = lookupInputContainer.classList;
                clsList.add('slds-is-open');
                if (this.searchKey.length > 0 && result.length == 0) {
                    this.messageFlag = true;
                } else {
                    this.messageFlag = false;
                }
            }).catch(error => {
                console.log(error);
            });
        }
    }
    // update searchKey property on input field change  
    handleKeyChange(event) {
        if((this.allowmultiple == 'true') && (this.selectedRecords.length == this.searchlimit)){
            return;
        }
        else
        {
        // Do not update the reactive property as long as this function is
        this.isSearchLoading = true;
        window.clearTimeout(this.delayTimeout);
        const searchKey = event.target.value;
        console.log('searchKey',searchKey);
        this.delayTimeout = setTimeout(() => {
            this.searchKey = searchKey;
            this.searchField();
        }, 300);
        }
    }
    // method to toggle lookup result section on UI 
    toggleResult(event) {
    
        const lookupInputContainer = this.template.querySelector('.lookupInputContainer');
        const clsList = lookupInputContainer.classList;
        const whichEvent = event.target.getAttribute('data-source');
        switch (whichEvent) {
            case 'searchInputField':
                clsList.add('slds-is-open');
                this.searchField();
                break;
            case 'lookupContainer':
                clsList.remove('slds-is-open');
                break;
        }
    
    }

    handleKeyPress(event) {
    if (event.key === 'Enter') {
        this.searchRecords = [];
        this.searchKey = event.target.value;
        console.log('Key pressed:', event.key);

        // Dispatch an event so parent knows user pressed Enter
        const searchEvent = new CustomEvent('entersearch', {
            detail: this.searchKey
        });
        this.dispatchEvent(searchEvent);
        console.log('Dispatched search term:', this.searchKey);
    }
}



    setSelectedRecord(event) {
        var recId = event.target.dataset.id;
        var selectName = event.currentTarget.dataset.name;
        let newsObject = this.searchRecords.find(data => data.Id === recId);
        this.selectedRecords.push(newsObject);
        this.template.querySelector('.lookupInputContainer').classList.remove('slds-is-open');
        let selRecords = this.selectedRecords;
        this.template.querySelectorAll('lightning-input').forEach(each => {
            each.value = '';
        });
        console.log('add',this.selectedRecords);
        const selectedEvent = new CustomEvent('selected', { detail: { selRecords }, });
        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }
    removeRecord(event) {
        if(this.aftersubmit == true)
        {
            console.log('after submit you cannot edit or add');

        }else
        {
        let selectRecId = [];
        for (let i = 0; i < this.selectedRecords.length; i++) {
            console.log('event.detail.name--------->' + event.detail.name);
            console.log('this.selectedRecords[i].Id--------->' + this.selectedRecords[i].Id);
            if (event.detail.name !== this.selectedRecords[i].Id)
                selectRecId.push(this.selectedRecords[i]);
        }
        this.selectedRecords = [...selectRecId];
        console.log('this.selectedRecords----------->' + this.selectedRecords);
        let selRecords = this.selectedRecords;
                console.log('re',this.selectedRecords);

        const selectedEvent = new CustomEvent('selected', { detail: { selRecords }, });
        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
        }
    }

   //Handler class for Toast message
showAlert(message,title,varient) {
    const evt = new ShowToastEvent({
        title: title,
        message: message,
        variant: varient
    });
    this.dispatchEvent(evt);
}
// Using a setter to detect property change
    _clearData = false;
    @api 
    set clearData(value) {
        if (value) {
            this.clearArray();
        }
        this._clearData = value;
    }
    get clearData() {
        return this._clearData;
    }

    clearArray() {
        console.log("Updated this.selectedRecords:",this.selectedRecords);
        this.selectedRecords = [];
    }
   
}