# Cerros Del Aguila - Sommerhus Booking System

A React-based booking system for managing summer house reservations.

## Features

- 📅 Interactive calendar interface
- 📧 Email notifications via EmailJS
- 👥 Admin panel for booking management
- ✈️ Flight ticket upload functionality
- 💾 Local storage for data persistence
- 🔐 Admin authentication

## Setup Instructions

### 1. Email Configuration (Required for notifications)

To enable email functionality:

1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Create an email service (Gmail, Outlook, etc.)
3. Create an email template with the following variables:
   - `{{to_name}}`
   - `{{from_name}}`
   - `{{booking_name}}`
   - `{{booking_guests}}`
   - `{{booking_start}}`
   - `{{booking_end}}`
   - `{{booking_days}}`
   - `{{booking_comment}}`
   - `{{needs_approval}}`
   - `{{message}}`

4. Update the `EMAIL_CONFIG` object in `app.jsx`:

```javascript
const EMAIL_CONFIG = {
  PUBLIC_KEY: 'your_public_key_here',
  SERVICE_ID: 'your_service_id_here',
  TEMPLATE_ID: 'your_template_id_here'
};
```

### 2. Running the Application

1. Open `index.html` in a web browser, or
2. Serve via a local web server:
   ```bash
   python3 -m http.server 8000
   # Then open http://localhost:8000
   ```

## Usage

1. **Select Dates**: Click start and end dates on the calendar
2. **Fill Form**: Enter name, guest count, and optional comments
3. **Submit Booking**: Bookings over 14 days require admin approval
4. **Upload Tickets**: Flight tickets must be uploaded within 14 days
5. **Admin Access**: Use password `sommerhus2025` for admin functions

## Admin Features

- Approve/reject pending bookings
- View all bookings and their status
- Delete existing bookings
- Download uploaded flight tickets

## Technical Details

- **Frontend**: React 18 with Babel for JSX transformation
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Email**: EmailJS for notifications
- **Storage**: Browser localStorage for persistence

## Files

- `index.html` - Main HTML file with dependencies
- `app.jsx` - React application component
- `README.md` - This documentation

## Browser Compatibility

Requires a modern browser with ES6+ support. Tested with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+