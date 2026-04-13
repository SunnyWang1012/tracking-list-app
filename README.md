# Tracking List App

A personal work-tracking web application designed for DM/ePO roles to manage multiple work threads across Email, Teams, JIRA, and Confluence.

## Features

### Core Functionality
- **Work Items**: Create items with title, content, channel, action, stakeholder, contact, and due date
- **Dual Status System**: "To Do" and "Await" checkboxes for completion tracking
- **Smart Views**: "Today's Items" (urgent/due today) and "All Items" (complete list)
- **Advanced Filtering**: Filter by urgency, due date, status, release version, channel, stakeholder, contact
- **Flexible Sorting**: Sort by due date, urgency, last updated, or creation date

### Data Management
- **Local Storage**: All data saved locally in the browser
- **No Backend Required**: Works completely offline
- **Persistent Data**: Survives page refreshes and browser restarts
- **User-Managed Reference Data**: Add/edit release versions, channels, actions, stakeholders, contacts, and contact groups

### User Experience
- **Modern UI**: Clean, card-based design with color-coded labels
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Visual Priority**: Red highlighting for urgent items
- **Smart Search**: Search functionality for contacts and release versions
- **Professional Styling**: Dark theme with blue (#6ab3fb), green (#bbff99), and red (#ffb3b3) accents

## Technical Implementation

### Frontend Stack
- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with CSS variables and Grid/Flexbox
- **Vanilla JavaScript (ES6+)**: No frameworks required
- **Google Fonts**: Inter font for modern typography

### Key JavaScript Features
- **Class-based Architecture**: WorkTracker class with clean organization
- **Async/Await**: Modern asynchronous patterns for data operations
- **Event Delegation**: Efficient event handling for dynamic content
- **Local Storage API**: Browser-based data persistence
- **Template Literals**: Dynamic HTML generation
- **Search Functionality**: Real-time search for contacts and releases
- **Modal Management**: Advanced modal handling for settings and item editing

### CSS Features
- **CSS Variables**: Consistent theming with color palette
- **Flexbox & Grid**: Modern layout systems
- **Smooth Transitions**: Polished micro-interactions and hover effects
- **Mobile-First Design**: Responsive breakpoints
- **Dark Theme**: Professional dark background (#222222)
- **Color-Coded Labels**: Blue (#6ab3fb), Green (#bbff99), Red (#ffb3b3)

## Quick Start

1. Open `worktracker.html` in your web browser
2. Start adding work items immediately
3. All data is saved automatically
4. Use "Manage Lists" to configure your reference data

## File Structure

```
Tracking List App/
|-- worktracker.html      # Main application HTML
|-- worktracker-styles.css # Complete styling
|-- worktracker-app.js     # JavaScript functionality
|-- package.json          # Project metadata
|-- .gitignore           # Git ignore file
|-- README.md             # This documentation
```

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Works on all modern mobile browsers

## Future Enhancements

- Drag & Drop work item reordering
- Work item categories/projects
- Advanced search across all fields
- Export/Import functionality for data backup
- Multiple theme options
- Email/Teams/JIRA integration
- Keyboard shortcuts for power users
- Analytics and reporting dashboard
- Team collaboration features
- Mobile app version
