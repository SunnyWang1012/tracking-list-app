// Test script to verify data persistence fixes
// This simulates the browser environment for testing

// Mock localStorage
const mockLocalStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    removeItem: function(key) {
        delete this.data[key];
    },
    clear: function() {
        this.data = {};
    }
};

// Mock document methods for testing
global.localStorage = mockLocalStorage;
global.console = console;

// Load the WorkTracker class (simplified version for testing)
const mergeArray = (defaultArray, savedArray) => {
    const combined = [...defaultArray, ...savedArray];
    const unique = [...new Set(combined)];
    return unique.sort();
};

const mergeContacts = (defaultContacts, savedContacts) => {
    const contactMap = new Map();
    
    defaultContacts.forEach(contact => {
        contactMap.set(contact.email, contact);
    });
    
    savedContacts.forEach(contact => {
        contactMap.set(contact.email, contact);
    });
    
    return Array.from(contactMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const mergeGroups = (defaultGroups, savedGroups) => {
    const groupMap = new Map();
    
    defaultGroups.forEach(group => {
        groupMap.set(group.name, group);
    });
    
    savedGroups.forEach(group => {
        groupMap.set(group.name, group);
    });
    
    return Array.from(groupMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

// Test data
const defaultContacts = [
    { name: 'John Intel', email: 'john@intel.com' },
    { name: 'Sarah Dell', email: 'sarah@dell.com' }
];

const defaultGroups = [
    { name: 'Intel Team', contacts: ['John Intel'] },
    { name: 'Dell Team', contacts: ['Sarah Dell'] }
];

// Test 1: Save and load contacts
console.log('=== Test 1: Contacts Persistence ===');
const savedContacts = [
    { name: 'Mike AMD', email: 'mike@amd.com' },
    { name: 'Jane Foxconn', email: 'jane@foxconn.com' }
];

const mergedContacts = mergeContacts(defaultContacts, savedContacts);
console.log('Merged contacts:', mergedContacts);
console.log('Expected 4 contacts, got:', mergedContacts.length);

// Test 2: Save and load groups
console.log('\n=== Test 2: Groups Persistence ===');
const savedGroups = [
    { name: 'AMD Team', contacts: ['Mike AMD'] },
    { name: 'Foxconn Team', contacts: ['Jane Foxconn'] }
];

const mergedGroups = mergeGroups(defaultGroups, savedGroups);
console.log('Merged groups:', mergedGroups);
console.log('Expected 4 groups, got:', mergedGroups.length);

// Test 3: Test duplicate handling
console.log('\n=== Test 3: Duplicate Handling ===');
const duplicateContacts = [
    { name: 'John Intel Updated', email: 'john@intel.com' }, // Same email, different name
    { name: 'New Contact', email: 'new@company.com' }
];

const mergedWithDuplicates = mergeContacts(defaultContacts, duplicateContacts);
console.log('Merged with duplicates:', mergedWithDuplicates);
console.log('John Intel should be updated, got:', mergedWithDuplicates.find(c => c.email === 'john@intel.com'));

// Test 4: Test localStorage simulation
console.log('\n=== Test 4: localStorage Simulation ===');
const testData = {
    workItems: [],
    referenceData: {
        contacts: savedContacts,
        groups: savedGroups
    }
};

try {
    localStorage.setItem('workTrackerData', JSON.stringify(testData));
    const loaded = JSON.parse(localStorage.getItem('workTrackerData'));
    console.log('Data saved and loaded successfully');
    console.log('Loaded contacts count:', loaded.referenceData.contacts.length);
    console.log('Loaded groups count:', loaded.referenceData.groups.length);
} catch (error) {
    console.error('localStorage test failed:', error);
}

console.log('\n=== All Tests Completed ===');
