class WorkTracker {
    constructor() {
        this.workItems = [];
        this.currentView = 'today'; // 'today' or 'all'
        this.currentFilters = {
            urgent: false,
            dueToday: false,
            completed: false,
            status: '',
            releaseVersion: '',
            channel: '',
            action: '',
            stakeholder: '',
            contact: '',
            dueDateRange: ''
        };
        this.currentSort = 'dueDate';
        this.editingId = null;
        
        // User-managed reference data
        this.referenceData = {
            releaseVersions: ['Archon 6.13', 'Archon 6.14'],
            channels: ['Email', 'Teams', 'JIRA', 'Confluence', 'URL'],
            actions: {
                'Email': ['New', 'Reply'],
                'Teams': ['Enquiry', 'Reply'],
                'Confluence': ['Add', 'Update'],
                'JIRA': ['Create', 'Update', 'Add Disposition', 'Add Comment'],
                'URL': ['Reply', 'Learning']
            },
            stakeholders: ['Intel', 'Dell', 'AMD', 'Foxconn', 'Compal', 'Wistron'],
            contacts: [
                { name: 'John Intel', email: 'john@intel.com' },
                { name: 'Sarah Dell', email: 'sarah@dell.com' }
            ],
            groups: [
                { name: 'Intel Team', contacts: ['John Intel'] },
                { name: 'Dell Team', contacts: ['Sarah Dell'] }
            ]
        };
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.populateFilterDropdowns();
        this.render();
        this.updateCounts();
    }

    async loadData() {
        const stored = localStorage.getItem('workTrackerData');
        if (stored) {
            const data = JSON.parse(stored);
            this.workItems = data.workItems || [];
            
            // Properly merge reference data, adding new default items
            const savedRefData = data.referenceData || {};
            
            // Merge arrays, ensuring new defaults are included
            this.referenceData = {
                releaseVersions: this.mergeArray(this.referenceData.releaseVersions, savedRefData.releaseVersions || []),
                channels: this.mergeArray(this.referenceData.channels, savedRefData.channels || []),
                actions: { ...this.referenceData.actions, ...savedRefData.actions },
                stakeholders: this.mergeArray(this.referenceData.stakeholders, savedRefData.stakeholders || []),
                contacts: this.mergeArray(this.referenceData.contacts, savedRefData.contacts || []),
                groups: this.mergeArray(this.referenceData.groups, savedRefData.groups || [])
            };
        } else {
            // Initialize with sample data
            this.workItems = [
                {
                    id: this.generateId(),
                    title: 'Follow up on Intel validation results',
                    content: 'Need to get confirmation from Intel team about the DVT validation results and address any concerns they have.',
                    releaseVersion: 'Archon 6.13',
                    dueDate: this.getToday(),
                    channel: 'Email',
                    action: 'Reply',
                    stakeholder: 'Intel',
                    contact: { name: 'John Intel', email: 'john@intel.com' },
                    isUrgent: true,
                    status: 'action-needed',
                    completed: false,
                    createdAt: new Date().toISOString(),
                    lastUpdatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    title: 'Update JIRA story with test cases',
                    content: 'Add the new test cases to the JIRA story for the power management feature.',
                    releaseVersion: 'Archon 6.13',
                    dueDate: this.getToday(),
                    channel: 'JIRA',
                    action: 'Update',
                    stakeholder: 'Dell',
                    contact: { name: 'Sarah Dell', email: 'sarah@dell.com' },
                    isUrgent: false,
                    status: 'awaiting-owner',
                    completed: false,
                    createdAt: new Date().toISOString(),
                    lastUpdatedAt: new Date().toISOString()
                }
            ];
            await this.saveData();
        }
    }

    mergeArray(defaultArray, savedArray) {
        // Combine default and saved arrays, remove duplicates, and sort
        const combined = [...defaultArray, ...savedArray];
        const unique = [...new Set(combined)];
        return unique.sort();
    }

    async saveData() {
        const data = {
            workItems: this.workItems,
            referenceData: this.referenceData
        };
        localStorage.setItem('workTrackerData', JSON.stringify(data));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getToday() {
        return new Date().toISOString().split('T')[0];
    }

    setupEventListeners() {
        // View switching
        document.getElementById('todayViewBtn').addEventListener('click', () => this.switchView('today'));
        document.getElementById('allViewBtn').addEventListener('click', () => this.switchView('all'));
        
        // New item button
        document.getElementById('newItemBtn').addEventListener('click', () => this.openItemModal());
        
        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.closeItemModal());
        document.getElementById('cancelItemBtn').addEventListener('click', () => this.closeItemModal());
        
        // Form submission
        document.getElementById('itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });
        
        // Channel change handler for dynamic actions
        document.getElementById('itemChannel').addEventListener('change', (e) => {
            this.updateActionOptions(e.target.value);
        });
        
        // Quick filters
        document.querySelectorAll('.quick-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filterType = e.target.dataset.filter;
                this.toggleQuickFilter(filterType);
            });
        });
        
        // Advanced filters
        document.querySelectorAll('.advanced-filter').forEach(input => {
            input.addEventListener('change', (e) => {
                const filterType = e.target.dataset.filter;
                const value = e.target.value;
                this.currentFilters[filterType] = value;
                this.render();
            });
        });
        
        // Sorting
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.render();
        });
        
        // Reference data management
        document.getElementById('manageRefDataBtn').addEventListener('click', () => this.openRefDataModal());
        document.getElementById('closeRefModal').addEventListener('click', () => this.closeRefDataModal());
    }

    switchView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.id === `${view}ViewBtn`);
        });
        
        this.render();
    }

    toggleQuickFilter(filterType) {
        this.currentFilters[filterType] = !this.currentFilters[filterType];
        
        // Update button state
        const btn = document.querySelector(`[data-filter="${filterType}"]`);
        btn.classList.toggle('active', this.currentFilters[filterType]);
        
        this.render();
    }

    updateActionOptions(channel) {
        const actionSelect = document.getElementById('itemAction');
        const actions = this.referenceData.actions[channel] || [];
        
        actionSelect.innerHTML = '<option value="">Select action...</option>';
        actions.forEach(action => {
            actionSelect.innerHTML += `<option value="${action}">${action}</option>`;
        });
    }

    getFilteredAndSortedItems() {
        let items = [...this.workItems];
        
        // Apply view filter
        if (this.currentView === 'today') {
            const today = this.getToday();
            items = items.filter(item => 
                item.dueDate <= today && !item.completed
            );
        }
        
        // Apply quick filters
        if (this.currentFilters.urgent) items = items.filter(item => item.isUrgent);
        if (this.currentFilters.dueToday) {
            const today = this.getToday();
            items = items.filter(item => item.dueDate <= today);
        }
        
        // Hide completed items by default, only show when Completed filter is clicked
        if (this.currentFilters.completed) {
            items = items.filter(item => item.completed);
        } else {
            items = items.filter(item => !item.completed);
        }
        
        // Apply advanced filters
        if (this.currentFilters.releaseVersion) {
            items = items.filter(item => item.releaseVersion === this.currentFilters.releaseVersion);
        }
        if (this.currentFilters.channel) {
            items = items.filter(item => item.channel === this.currentFilters.channel);
        }
        if (this.currentFilters.action) {
            items = items.filter(item => item.action === this.currentFilters.action);
        }
        if (this.currentFilters.stakeholder) {
            items = items.filter(item => item.stakeholder === this.currentFilters.stakeholder);
        }
        if (this.currentFilters.status) {
            items = items.filter(item => item.status === this.currentFilters.status);
        }
        
        // Apply sorting
        items.sort((a, b) => {
            switch (this.currentSort) {
                case 'urgent':
                    if (a.isUrgent !== b.isUrgent) return b.isUrgent - a.isUrgent;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'dueDate':
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'lastUpdated':
                    return new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt);
                case 'createdDate':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                default:
                    return 0;
            }
        });
        
        return items;
    }

    openItemModal(itemId = null) {
        this.editingId = itemId;
        const modal = document.getElementById('itemModal');
        const form = document.getElementById('itemForm');
        
        // Populate reference data dropdowns
        this.populateReferenceDropdowns();
        
        if (itemId) {
            const item = this.workItems.find(i => i.id === itemId);
            if (item) {
                document.getElementById('modalTitle').textContent = 'Edit Work Item';
                this.populateForm(item);
            }
        } else {
            document.getElementById('modalTitle').textContent = 'New Work Item';
            form.reset();
            document.getElementById('itemDueDate').value = this.getToday();
            this.updateActionOptions('Email'); // Default channel
        }
        
        modal.classList.add('active');
    }

    closeItemModal() {
        const modal = document.getElementById('itemModal');
        modal.classList.remove('active');
        this.editingId = null;
    }

    populateForm(item) {
        document.getElementById('itemTitle').value = item.title;
        document.getElementById('itemContent').value = item.content;
        document.getElementById('itemReleaseVersion').value = item.releaseVersion;
        document.getElementById('itemDueDate').value = item.dueDate;
        document.getElementById('itemChannel').value = item.channel;
        this.updateActionOptions(item.channel);
        document.getElementById('itemAction').value = item.action;
        document.getElementById('itemStakeholder').value = item.stakeholder;
        document.getElementById('itemContact').value = item.contactName || '';
        document.getElementById('itemUrgent').checked = item.isUrgent;
    }

    async saveItem() {
        const formData = {
            title: document.getElementById('itemTitle').value.trim(),
            content: document.getElementById('itemContent').value.trim(),
            releaseVersion: document.getElementById('itemReleaseVersion').value,
            dueDate: document.getElementById('itemDueDate').value,
            channel: document.getElementById('itemChannel').value,
            action: document.getElementById('itemAction').value,
            stakeholder: document.getElementById('itemStakeholder').value,
            contactName: document.getElementById('itemContact').value,
            isUrgent: document.getElementById('itemUrgent').checked,
            status: 'action-needed' // Default status for new items
        };

        if (!formData.title || !formData.channel) {
            alert('Title and Channel are required');
            return;
        }

        // Find contact object
        const contact = this.referenceData.contacts.find(c => c.name === formData.contactName) ||
                       this.referenceData.groups.find(g => g.name === formData.contactName);

        if (this.editingId) {
            // Update existing item
            const index = this.workItems.findIndex(i => i.id === this.editingId);
            if (index !== -1) {
                this.workItems[index] = {
                    ...this.workItems[index],
                    ...formData,
                    contact,
                    completed: formData.status === 'resolved',
                    lastUpdatedAt: new Date().toISOString()
                };
            }
        } else {
            // Create new item
            const newItem = {
                id: this.generateId(),
                ...formData,
                contact,
                completed: formData.status === 'resolved',
                createdAt: new Date().toISOString(),
                lastUpdatedAt: new Date().toISOString()
            };
            this.workItems.unshift(newItem);
        }

        await this.saveData();
        this.closeItemModal();
        this.render();
        this.updateCounts();
    }

    async deleteItem(itemId) {
        if (confirm('Are you sure you want to delete this work item?')) {
            this.workItems = this.workItems.filter(i => i.id !== itemId);
            await this.saveData();
            this.render();
            this.updateCounts();
        }
    }

    async updateStatus(itemId, newStatus) {
        const item = this.workItems.find(i => i.id === itemId);
        if (item) {
            item.status = newStatus;
            item.completed = newStatus === 'resolved';
            item.lastUpdatedAt = new Date().toISOString();
            await this.saveData();
            this.render();
            this.updateCounts();
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    isOverdue(dateString) {
        if (!dateString) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(dateString);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    }

    updateCounts() {
        const today = this.getToday();
        const todayItems = this.workItems.filter(item => 
            item.dueDate <= today && !item.completed
        );
        
        document.getElementById('todayCount').textContent = todayItems.length;
        document.getElementById('allCount').textContent = this.workItems.length;
    }

    populateReferenceDropdowns() {
        // Release versions
        const releaseSelect = document.getElementById('itemReleaseVersion');
        releaseSelect.innerHTML = '<option value="">Select release...</option>';
        this.referenceData.releaseVersions.forEach(version => {
            releaseSelect.innerHTML += `<option value="${version}">${version}</option>`;
        });
        
        // Channels
        const channelSelect = document.getElementById('itemChannel');
        channelSelect.innerHTML = '<option value="">Select channel...</option>';
        this.referenceData.channels.forEach(channel => {
            channelSelect.innerHTML += `<option value="${channel}">${channel}</option>`;
        });
        
        // Stakeholders
        const stakeholderSelect = document.getElementById('itemStakeholder');
        stakeholderSelect.innerHTML = '<option value="">Select stakeholder...</option>';
        this.referenceData.stakeholders.forEach(stakeholder => {
            stakeholderSelect.innerHTML += `<option value="${stakeholder}">${stakeholder}</option>`;
        });
        
        // Contacts and Groups
        const contactSelect = document.getElementById('itemContact');
        contactSelect.innerHTML = '<option value="">Select contact or group...</option>';
        
        // Add contacts
        this.referenceData.contacts.forEach(contact => {
            contactSelect.innerHTML += `<option value="${contact.name}">${contact.name} (${contact.email})</option>`;
        });
        
        // Add groups
        this.referenceData.groups.forEach(group => {
            contactSelect.innerHTML += `<option value="${group.name}">${group.name} (Group)</option>`;
        });
    }

    populateFilterDropdowns() {
        // Release versions filter
        const releaseFilter = document.querySelector('[data-filter="releaseVersion"]');
        releaseFilter.innerHTML = '<option value="">All Releases</option>';
        this.referenceData.releaseVersions.forEach(version => {
            releaseFilter.innerHTML += `<option value="${version}">${version}</option>`;
        });
        
        // Channels filter
        const channelFilter = document.querySelector('[data-filter="channel"]');
        channelFilter.innerHTML = '<option value="">All Channels</option>';
        this.referenceData.channels.forEach(channel => {
            channelFilter.innerHTML += `<option value="${channel}">${channel}</option>`;
        });
        
        // Actions filter (will be populated dynamically based on selected channel)
        const actionFilter = document.querySelector('[data-filter="action"]');
        actionFilter.innerHTML = '<option value="">All Actions</option>';
        
        // Stakeholders filter
        const stakeholderFilter = document.querySelector('[data-filter="stakeholder"]');
        stakeholderFilter.innerHTML = '<option value="">All Stakeholders</option>';
        this.referenceData.stakeholders.forEach(stakeholder => {
            stakeholderFilter.innerHTML += `<option value="${stakeholder}">${stakeholder}</option>`;
        });
    }

    render() {
        const items = this.getFilteredAndSortedItems();
        const container = document.getElementById('itemsContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (items.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        container.innerHTML = items.map(item => this.renderItem(item)).join('');
    }

    renderItem(item) {
        const isOverdue = this.isOverdue(item.dueDate);
        const isToday = item.dueDate === this.getToday();
        
        return `
            <div class="work-item ${item.completed ? 'completed' : ''} ${item.isUrgent ? 'urgent' : ''}">
                <div class="item-stripe ${item.isUrgent ? 'urgent' : ''}"></div>
                
                <div class="item-left">
                    <div class="status-dropdown">
                        <select class="status-select" onchange="workTracker.updateStatus('${item.id}', this.value)">
                            <option value="action-needed" ${item.status === 'action-needed' ? 'selected' : ''}>Action Needed</option>
                            <option value="awaiting-owner" ${item.status === 'awaiting-owner' ? 'selected' : ''}>Awaiting Owner</option>
                            <option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
                    </div>
                </div>
                
                <div class="item-main">
                    <div class="item-title">${this.escapeHtml(item.title)}</div>
                    <div class="item-content">${this.escapeHtml(item.content)}</div>
                    
                    <div class="item-meta">
                        <span class="meta-pill channel">${item.channel}</span>
                        <span class="meta-pill action">${item.action}</span>
                        <span class="meta-pill stakeholder">${item.stakeholder}</span>
                    </div>
                </div>
                
                <div class="item-right">
                    <div class="item-due-date ${isOverdue ? 'overdue' : isToday ? 'today' : ''}">
                        ${this.formatDate(item.dueDate)}
                    </div>
                    <div class="item-release">${item.releaseVersion}</div>
                    
                    <div class="item-actions">
                        <button class="btn-icon" onclick="workTracker.openItemModal('${item.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="workTracker.deleteItem('${item.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Reference data management methods
    openRefDataModal() {
        const modal = document.getElementById('refDataModal');
        modal.classList.add('active');
        this.renderSettingsTabs();
        this.setupSettingsEventListeners();
    }

    closeRefDataModal() {
        const modal = document.getElementById('refDataModal');
        modal.classList.remove('active');
    }

    setupSettingsEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchSettingsTab(tabName);
            });
        });

        // Contact search functionality
        const contactSearchInput = document.getElementById('newContactName');
        const searchDropdown = document.getElementById('contactSearchDropdown');
        
        contactSearchInput.addEventListener('input', (e) => {
            this.handleContactSearch(e.target.value);
        });

        contactSearchInput.addEventListener('focus', () => {
            if (contactSearchInput.value.trim()) {
                this.handleContactSearch(contactSearchInput.value);
            }
        });

        // Close search dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.contact-search-container')) {
                searchDropdown.classList.remove('active');
            }
        });

        // Group contacts search
        const groupSearchInput = document.getElementById('groupContactSearch');
        const groupSearchDropdown = document.getElementById('groupContactSearchDropdown');
        
        groupSearchInput.addEventListener('input', (e) => {
            this.handleGroupContactSearch(e.target.value);
        });

        groupSearchInput.addEventListener('focus', () => {
            if (groupSearchInput.value.trim()) {
                this.handleGroupContactSearch(groupSearchInput.value);
            }
        });

        // Close group search dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.group-search-container')) {
                groupSearchDropdown.classList.remove('active');
            }
        });

        // Release search functionality
        const releaseSearchInput = document.getElementById('newRelease');
        const releaseSearchDropdown = document.getElementById('releaseSearchDropdown');
        
        releaseSearchInput.addEventListener('input', (e) => {
            this.handleReleaseSearch(e.target.value);
        });

        releaseSearchInput.addEventListener('focus', () => {
            if (releaseSearchInput.value.trim()) {
                this.handleReleaseSearch(releaseSearchInput.value);
            }
        });

        // Close release search dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.contact-search-container') || e.target.closest('#releaseSearchDropdown')) {
                releaseSearchDropdown.classList.remove('active');
            }
        });

        // Edit group modal event listeners
        document.getElementById('closeEditGroupModal').addEventListener('click', () => {
            this.closeEditGroupModal();
        });

        const editGroupSearchInput = document.getElementById('editGroupContactSearch');
        const editGroupSearchDropdown = document.getElementById('editGroupContactSearchDropdown');
        
        editGroupSearchInput.addEventListener('input', (e) => {
            this.handleEditGroupContactSearch(e.target.value);
        });

        editGroupSearchInput.addEventListener('focus', () => {
            if (editGroupSearchInput.value.trim()) {
                this.handleEditGroupContactSearch(editGroupSearchInput.value);
            }
        });

        // Close edit group search dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.group-search-container') || e.target.closest('#editGroupContactSearchDropdown')) {
                editGroupSearchDropdown.classList.remove('active');
            }
        });
    }

    switchSettingsTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // Render specific tab content
        this.renderTabContent(tabName);
    }

    renderTabContent(tabName) {
        switch (tabName) {
            case 'releases':
                this.renderReleasesList();
                break;
            case 'channels':
                this.renderChannelsList();
                break;
            case 'stakeholders':
                this.renderStakeholdersList();
                break;
            case 'contacts':
                this.renderContactsList();
                break;
            case 'groups':
                this.renderGroupsList();
                this.populateGroupContactsSelect();
                break;
        }
    }

    renderSettingsTabs() {
        this.renderTabContent('releases');
    }

    // Release Search Functionality
    handleReleaseSearch(searchTerm) {
        const dropdown = document.getElementById('releaseSearchDropdown');
        
        if (!searchTerm.trim()) {
            dropdown.classList.remove('active');
            return;
        }

        const filteredReleases = this.referenceData.releaseVersions.filter(version =>
            version.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredReleases.length > 0) {
            dropdown.innerHTML = filteredReleases.map(version => `
                <div class="contact-search-result" onclick="workTracker.selectRelease('${version}')">
                    <div class="contact-search-result-name">${this.escapeHtml(version)}</div>
                </div>
            `).join('');
            dropdown.classList.add('active');
        } else {
            dropdown.classList.remove('active');
        }
    }

    selectRelease(version) {
        const input = document.getElementById('newRelease');
        const dropdown = document.getElementById('releaseSearchDropdown');
        
        input.value = version;
        dropdown.classList.remove('active');
    }

    // Release Versions Management
    async addReleaseVersion() {
        const input = document.getElementById('newRelease');
        const version = input.value.trim();
        
        if (!version) return;
        
        if (!this.referenceData.releaseVersions.includes(version)) {
            this.referenceData.releaseVersions.push(version);
            this.referenceData.releaseVersions.sort();
            await this.saveData();
            this.populateFilterDropdowns();
            this.populateReferenceDropdowns();
            this.renderReleasesList();
            input.value = '';
        }
        
        // Close search dropdown
        document.getElementById('releaseSearchDropdown').classList.remove('active');
    }

    renderReleasesList() {
        const container = document.getElementById('releasesList');
        container.innerHTML = this.referenceData.releaseVersions.map((version, index) => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${this.escapeHtml(version)}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn-icon-sm delete" onclick="workTracker.deleteReleaseVersion(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteReleaseVersion(index) {
        if (confirm('Are you sure you want to delete this release version?')) {
            this.referenceData.releaseVersions.splice(index, 1);
            await this.saveData();
            this.populateFilterDropdowns();
            this.populateReferenceDropdowns();
            this.renderReleasesList();
        }
    }

    // Channels Management
    async addChannel() {
        const input = document.getElementById('newChannel');
        const channel = input.value.trim();
        
        if (!channel) return;
        
        if (!this.referenceData.channels.includes(channel)) {
            this.referenceData.channels.push(channel);
            this.referenceData.channels.sort();
            await this.saveData();
            this.populateFilterDropdowns();
            this.populateReferenceDropdowns();
            this.renderChannelsList();
            input.value = '';
        }
    }

    renderChannelsList() {
        const container = document.getElementById('channelsList');
        container.innerHTML = this.referenceData.channels.map((channel, index) => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${this.escapeHtml(channel)}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn-icon-sm delete" onclick="workTracker.deleteChannel(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteChannel(index) {
        if (confirm('Are you sure you want to delete this channel?')) {
            this.referenceData.channels.splice(index, 1);
            await this.saveData();
            this.populateFilterDropdowns();
            this.populateReferenceDropdowns();
            this.renderChannelsList();
        }
    }

    // Stakeholders Management
    async addStakeholder() {
        const input = document.getElementById('newStakeholder');
        const stakeholder = input.value.trim();
        
        if (!stakeholder) return;
        
        if (!this.referenceData.stakeholders.includes(stakeholder)) {
            this.referenceData.stakeholders.push(stakeholder);
            this.referenceData.stakeholders.sort();
            await this.saveData();
            this.populateFilterDropdowns();
            this.populateReferenceDropdowns();
            this.renderStakeholdersList();
            input.value = '';
        }
    }

    renderStakeholdersList() {
        const container = document.getElementById('stakeholdersList');
        container.innerHTML = this.referenceData.stakeholders.map((stakeholder, index) => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${this.escapeHtml(stakeholder)}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn-icon-sm delete" onclick="workTracker.deleteStakeholder(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteStakeholder(index) {
        if (confirm('Are you sure you want to delete this stakeholder?')) {
            this.referenceData.stakeholders.splice(index, 1);
            await this.saveData();
            this.populateFilterDropdowns();
            this.populateReferenceDropdowns();
            this.renderStakeholdersList();
        }
    }

    // Contact Search Functionality
    handleContactSearch(searchTerm) {
        const dropdown = document.getElementById('contactSearchDropdown');
        
        if (!searchTerm.trim()) {
            dropdown.classList.remove('active');
            return;
        }

        const filteredContacts = this.referenceData.contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredContacts.length > 0) {
            dropdown.innerHTML = filteredContacts.map(contact => `
                <div class="contact-search-result" onclick="workTracker.selectContact('${contact.name}', '${contact.email}')">
                    <div class="contact-search-result-name">${this.escapeHtml(contact.name)}</div>
                    <div class="contact-search-result-email">${this.escapeHtml(contact.email)}</div>
                </div>
            `).join('');
            dropdown.classList.add('active');
        } else {
            dropdown.classList.remove('active');
        }
    }

    selectContact(name, email) {
        const nameInput = document.getElementById('newContactName');
        const emailInput = document.getElementById('newContactEmail');
        const dropdown = document.getElementById('contactSearchDropdown');
        
        nameInput.value = name;
        emailInput.value = email;
        dropdown.classList.remove('active');
    }

    // Contacts Management
    async addContact() {
        const nameInput = document.getElementById('newContactName');
        const emailInput = document.getElementById('newContactEmail');
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        
        if (!name || !email) return;
        
        // Check for duplicate email
        if (this.referenceData.contacts.some(c => c.email === email)) {
            alert('A contact with this email already exists!');
            return;
        }
        
        const contact = { name, email };
        this.referenceData.contacts.push(contact);
        await this.saveData();
        this.populateReferenceDropdowns();
        this.renderContactsList();
        nameInput.value = '';
        emailInput.value = '';
        
        // Close search dropdown
        document.getElementById('contactSearchDropdown').classList.remove('active');
    }

    renderContactsList() {
        const container = document.getElementById('contactsList');
        container.innerHTML = this.referenceData.contacts.map((contact, index) => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${this.escapeHtml(contact.name)}</div>
                    <div class="list-item-subtitle">${this.escapeHtml(contact.email)}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn-icon-sm delete" onclick="workTracker.deleteContact(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteContact(index) {
        if (confirm('Are you sure you want to delete this contact?')) {
            const contact = this.referenceData.contacts[index];
            this.referenceData.contacts.splice(index, 1);
            
            // Remove from groups
            this.referenceData.groups.forEach(group => {
                group.contacts = group.contacts.filter(c => c !== contact.name);
            });
            
            await this.saveData();
            this.populateReferenceDropdowns();
            this.renderContactsList();
            this.renderGroupsList();
        }
    }

    // Group Contact Search Functionality
    handleGroupContactSearch(searchTerm) {
        const dropdown = document.getElementById('groupContactSearchDropdown');
        
        if (!searchTerm.trim()) {
            dropdown.classList.remove('active');
            return;
        }

        const filteredContacts = this.referenceData.contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredContacts.length > 0) {
            dropdown.innerHTML = filteredContacts.map(contact => `
                <div class="contact-search-result" onclick="workTracker.addContactToGroup('${contact.name}', '${contact.email}')">
                    <div class="contact-search-result-name">${this.escapeHtml(contact.name)}</div>
                    <div class="contact-search-result-email">${this.escapeHtml(contact.email)}</div>
                </div>
            `).join('');
            dropdown.classList.add('active');
        } else {
            dropdown.classList.remove('active');
        }
    }

    addContactToGroup(name, email) {
        const searchInput = document.getElementById('groupContactSearch');
        const dropdown = document.getElementById('groupContactSearchDropdown');
        
        // Check if contact is already in the list
        const currentContacts = this.getCurrentGroupContacts();
        if (currentContacts.includes(name)) {
            alert('This contact is already in the group!');
            return;
        }
        
        // Add to selected contacts
        this.selectedGroupContacts = this.selectedGroupContacts || [];
        this.selectedGroupContacts.push(name);
        
        // Update the visual list
        this.updateGroupContactsList();
        
        // Clear search
        searchInput.value = '';
        dropdown.classList.remove('active');
    }

    getCurrentGroupContacts() {
        const listContainer = document.getElementById('groupContactsList');
        const contactItems = listContainer.querySelectorAll('.group-contact-item');
        return Array.from(contactItems).map(item => 
            item.textContent.replace('×', '').trim()
        );
    }

    // Contact Groups Management
    populateGroupContactsSelect() {
        // This method is no longer needed since we're using search
    }

    updateGroupContactsList() {
        const listContainer = document.getElementById('groupContactsList');
        const selectedContacts = this.selectedGroupContacts || [];
        
        listContainer.innerHTML = selectedContacts.map(contactName => {
            const contact = this.referenceData.contacts.find(c => c.name === contactName);
            return `
                <div class="group-contact-item">
                    ${this.escapeHtml(contactName)}
                    <button onclick="workTracker.removeGroupContact('${contactName}')" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    removeGroupContact(contactName) {
        this.selectedGroupContacts = this.selectedGroupContacts || [];
        this.selectedGroupContacts = this.selectedGroupContacts.filter(name => name !== contactName);
        this.updateGroupContactsList();
    }

    async addContactGroup() {
        const nameInput = document.getElementById('newGroupName');
        const name = nameInput.value.trim();
        const selectedContacts = this.selectedGroupContacts || [];
        
        if (!name || selectedContacts.length === 0) {
            alert('Please enter a group name and add at least one contact.');
            return;
        }
        
        const group = { name, contacts: [...selectedContacts] };
        this.referenceData.groups.push(group);
        await this.saveData();
        this.populateReferenceDropdowns();
        this.renderGroupsList();
        
        // Clear form
        nameInput.value = '';
        this.selectedGroupContacts = [];
        this.updateGroupContactsList();
    }

    // Edit Group Modal Functionality
    openEditGroupModal(index) {
        this.editingGroupIndex = index;
        const group = this.referenceData.groups[index];
        const modal = document.getElementById('editGroupModal');
        
        // Set group name
        document.getElementById('editGroupName').value = group.name;
        
        // Set selected contacts
        this.selectedGroupContacts = [...group.contacts];
        this.updateEditGroupContactsList();
        
        modal.classList.add('active');
    }

    closeEditGroupModal() {
        const modal = document.getElementById('editGroupModal');
        modal.classList.remove('active');
        this.editingGroupIndex = null;
        this.selectedGroupContacts = [];
        
        // Clear search
        document.getElementById('editGroupContactSearch').value = '';
        document.getElementById('editGroupContactSearchDropdown').classList.remove('active');
    }

    handleEditGroupContactSearch(searchTerm) {
        const dropdown = document.getElementById('editGroupContactSearchDropdown');
        
        if (!searchTerm.trim()) {
            dropdown.classList.remove('active');
            return;
        }

        const filteredContacts = this.referenceData.contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredContacts.length > 0) {
            dropdown.innerHTML = filteredContacts.map(contact => `
                <div class="contact-search-result" onclick="workTracker.addContactToEditGroup('${contact.name}', '${contact.email}')">
                    <div class="contact-search-result-name">${this.escapeHtml(contact.name)}</div>
                    <div class="contact-search-result-email">${this.escapeHtml(contact.email)}</div>
                </div>
            `).join('');
            dropdown.classList.add('active');
        } else {
            dropdown.classList.remove('active');
        }
    }

    addContactToEditGroup(name, email) {
        const searchInput = document.getElementById('editGroupContactSearch');
        const dropdown = document.getElementById('editGroupContactSearchDropdown');
        
        // Check if contact is already in the list
        const currentContacts = this.selectedGroupContacts || [];
        if (currentContacts.includes(name)) {
            alert('This contact is already in the group!');
            return;
        }
        
        // Add to selected contacts
        this.selectedGroupContacts.push(name);
        
        // Update the visual list
        this.updateEditGroupContactsList();
        
        // Clear search
        searchInput.value = '';
        dropdown.classList.remove('active');
    }

    updateEditGroupContactsList() {
        const listContainer = document.getElementById('editGroupContactsList');
        const selectedContacts = this.selectedGroupContacts || [];
        
        listContainer.innerHTML = selectedContacts.map(contactName => {
            const contact = this.referenceData.contacts.find(c => c.name === contactName);
            return `
                <div class="group-contact-item">
                    ${this.escapeHtml(contactName)}
                    <button onclick="workTracker.removeEditGroupContact('${contactName}')" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    removeEditGroupContact(contactName) {
        this.selectedGroupContacts = this.selectedGroupContacts.filter(name => name !== contactName);
        this.updateEditGroupContactsList();
    }

    async saveEditedGroup() {
        const nameInput = document.getElementById('editGroupName');
        const name = nameInput.value.trim();
        const selectedContacts = this.selectedGroupContacts || [];
        
        if (!name || selectedContacts.length === 0) {
            alert('Please enter a group name and ensure at least one contact is selected.');
            return;
        }
        
        // Update the group
        this.referenceData.groups[this.editingGroupIndex] = {
            name: name,
            contacts: [...selectedContacts]
        };
        
        await this.saveData();
        this.populateReferenceDropdowns();
        this.renderGroupsList();
        this.closeEditGroupModal();
    }

    async editContactGroup(index) {
        this.openEditGroupModal(index);
    }

    renderGroupsList() {
        const container = document.getElementById('groupsList');
        container.innerHTML = this.referenceData.groups.map((group, index) => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${this.escapeHtml(group.name)}</div>
                    <div class="group-members">
                        ${group.contacts.map(contact => `<span>${this.escapeHtml(contact)}</span>`).join('')}
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="btn-icon-sm" onclick="workTracker.editContactGroup(${index})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon-sm delete" onclick="workTracker.deleteContactGroup(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteContactGroup(index) {
        if (confirm('Are you sure you want to delete this contact group?')) {
            this.referenceData.groups.splice(index, 1);
            await this.saveData();
            this.populateReferenceDropdowns();
            this.renderGroupsList();
        }
    }
}

// Initialize the work tracker
const workTracker = new WorkTracker();
