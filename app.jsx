const { useState, useEffect } = React;
const { Calendar, Upload, Check, AlertCircle, Mail, Users, Clock, X } = lucide;

// EmailJS Configuration
// To set up email functionality:
// 1. Sign up at https://www.emailjs.com/
// 2. Create a service (Gmail, Outlook, etc.)
// 3. Create an email template
// 4. Replace the placeholders below with your actual values
const EMAIL_CONFIG = {
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY', // Your EmailJS public key
  SERVICE_ID: 'YOUR_SERVICE_ID', // Your EmailJS service ID
  TEMPLATE_ID: 'YOUR_TEMPLATE_ID' // Your EmailJS template ID
};

const SommerhusBooking = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [emailJsLoaded, setEmailJsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    guests: 1,
    comment: ''
  });

  useEffect(() => {
    // Initialize EmailJS when the script loads
    const initEmailJS = () => {
      if (window.emailjs) {
        window.emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
        setEmailJsLoaded(true);
        console.log('EmailJS initialized successfully');
      } else {
        // If EmailJS hasn't loaded yet, try again in 100ms
        setTimeout(initEmailJS, 100);
      }
    };
    initEmailJS();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('sommerhusBookings');
    if (saved) {
      setBookings(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sommerhusBookings', JSON.stringify(bookings));
  }, [bookings]);

  const sendEmailNotification = async (booking, needsApproval) => {
    if (!emailJsLoaded || !window.emailjs) {
      console.warn('EmailJS ikke loadet endnu');
      return false;
    }

    // Check if EmailJS is properly configured
    if (EMAIL_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY' ||
        EMAIL_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID' ||
        EMAIL_CONFIG.TEMPLATE_ID === 'YOUR_TEMPLATE_ID') {
      console.warn('EmailJS not configured - please update EMAIL_CONFIG with your actual values');
      return false;
    }

    const templateParams = {
      to_name: 'Ulla og Eric',
      from_name: booking.name,
      booking_name: booking.name,
      booking_guests: booking.guests,
      booking_start: new Date(booking.startDate).toLocaleDateString('da-DK'),
      booking_end: new Date(booking.endDate).toLocaleDateString('da-DK'),
      booking_days: calculateDays(new Date(booking.startDate), new Date(booking.endDate)),
      booking_comment: booking.comment || 'Ingen kommentar',
      needs_approval: needsApproval ? 'JA - KRÆVER GODKENDELSE' : 'Nej',
      message: needsApproval 
        ? booking.name + ' har anmodet om at booke sommerhuset i ' + calculateDays(new Date(booking.startDate), new Date(booking.endDate)) + ' dage. Denne booking kræver jeres godkendelse da den er over 14 dage.'
        : booking.name + ' har booket sommerhuset. Bookingen er automatisk bekræftet.'
    };

    try {
      const response = await window.emailjs.send(
        EMAIL_CONFIG.SERVICE_ID,
        EMAIL_CONFIG.TEMPLATE_ID,
        templateParams
      );
      console.log('Email sendt succesfuldt!', response.status, response.text);
      return true;
    } catch (error) {
      console.error('Fejl ved afsendelse af email:', error);
      return false;
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateBooked = (date) => {
    return bookings.some(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return date >= start && date <= end;
    });
  };

  const getBookingForDate = (date) => {
    return bookings.find(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return date >= start && date <= end;
    });
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleDateClick = (date) => {
    if (isDateBooked(date)) {
      const booking = getBookingForDate(date);
      if (booking) {
        setSelectedBooking(booking);
      }
      return;
    }

    if (!selectedDates.start) {
      setSelectedDates({ start: date, end: null });
    } else if (!selectedDates.end) {
      if (date < selectedDates.start) {
        setSelectedDates({ start: date, end: selectedDates.start });
      } else {
        setSelectedDates({ start: selectedDates.start, end: date });
      }
      setShowBookingForm(true);
    } else {
      setSelectedDates({ start: date, end: null });
      setShowBookingForm(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    const days = calculateDays(selectedDates.start, selectedDates.end);
    const needsApproval = days > 14;
    
    const newBooking = {
      id: Date.now(),
      name: formData.name,
      guests: formData.guests,
      comment: formData.comment,
      startDate: selectedDates.start.toISOString(),
      endDate: selectedDates.end.toISOString(),
      createdAt: new Date().toISOString(),
      flightTicketUploaded: false,
      flightTicketDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: needsApproval ? 'pending' : 'confirmed'
    };

    const emailSent = await sendEmailNotification(newBooking, needsApproval);

    setBookings([...bookings, newBooking]);
    
    setSelectedDates({ start: null, end: null });
    setShowBookingForm(false);
    setFormData({ name: '', guests: 1, comment: '' });
    
    if (emailSent) {
      alert(needsApproval 
        ? 'Din booking er sendt til godkendelse hos Ulla og Eric! De har modtaget en email.'
        : 'Din booking er bekræftet! Ulla og Eric har modtaget en email. Husk at uploade flybilletter inden 14 dage.');
    } else {
      alert(needsApproval 
        ? 'Din booking er sendt til godkendelse hos Ulla og Eric!'
        : 'Din booking er bekræftet! Husk at uploade flybilletter inden 14 dage.');
    }
  };

  const handleFileUpload = (bookingId, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBookings(bookings.map(b => 
          b.id === bookingId 
            ? { ...b, flightTicketUploaded: true, flightTicketImage: reader.result }
            : b
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const approveBooking = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    setBookings(bookings.map(b => 
      b.id === bookingId ? { ...b, status: 'confirmed' } : b
    ));
    
    if (emailJsLoaded && window.emailjs) {
      try {
        await window.emailjs.send(
          EMAIL_CONFIG.SERVICE_ID,
          EMAIL_CONFIG.TEMPLATE_ID,
          {
            to_name: booking.name,
            from_name: 'Ulla og Eric',
            booking_name: booking.name,
            booking_guests: booking.guests,
            booking_start: new Date(booking.startDate).toLocaleDateString('da-DK'),
            booking_end: new Date(booking.endDate).toLocaleDateString('da-DK'),
            booking_days: calculateDays(new Date(booking.startDate), new Date(booking.endDate)),
            booking_comment: booking.comment || 'Ingen kommentar',
            needs_approval: 'GODKENDT',
            message: 'Din booking af sommerhuset er blevet godkendt af Ulla og Eric! Husk at uploade flybilletter inden 14 dage.'
          }
        );
      } catch (error) {
        console.error('Kunne ikke sende godkendelses-email:', error);
      }
    }
    
    alert('Booking godkendt!');
  };

  const rejectBooking = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    
    if (emailJsLoaded && window.emailjs) {
      try {
        await window.emailjs.send(
          EMAIL_CONFIG.SERVICE_ID,
          EMAIL_CONFIG.TEMPLATE_ID,
          {
            to_name: booking.name,
            from_name: 'Ulla og Eric',
            booking_name: booking.name,
            booking_guests: booking.guests,
            booking_start: new Date(booking.startDate).toLocaleDateString('da-DK'),
            booking_end: new Date(booking.endDate).toLocaleDateString('da-DK'),
            booking_days: calculateDays(new Date(booking.startDate), new Date(booking.endDate)),
            booking_comment: booking.comment || 'Ingen kommentar',
            needs_approval: 'AFVIST',
            message: 'Din booking af sommerhuset er desværre blevet afvist af Ulla og Eric. Kontakt dem venligst for mere information.'
          }
        );
      } catch (error) {
        console.error('Kunne ikke sende afvisnings-email:', error);
      }
    }
    
    setBookings(bookings.filter(b => b.id !== bookingId));
    alert('Booking afvist og slettet.');
  };

  const deleteBooking = (bookingId) => {
    if (window.confirm('Er du sikker på du vil slette denne booking?')) {
      setBookings(bookings.filter(b => b.id !== bookingId));
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'sommerhus2025') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Forkert adgangskode');
    }
  };
  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    const monthNames = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 
                       'Juli', 'August', 'September', 'Oktober', 'November', 'December'];
    const dayNames = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(React.createElement('div', { key: 'empty-' + i, className: "h-20 border border-gray-200" }));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isBooked = isDateBooked(date);
      const booking = getBookingForDate(date);
      const isSelected = (selectedDates.start && date.toDateString() === selectedDates.start.toDateString()) ||
                        (selectedDates.end && date.toDateString() === selectedDates.end.toDateString());
      const isInRange = selectedDates.start && selectedDates.end && 
                       date >= selectedDates.start && date <= selectedDates.end;

      let bgColor = 'bg-white hover:bg-blue-50';
      if (isBooked) {
        if (booking && booking.status === 'pending') {
          bgColor = 'bg-yellow-100';
        } else if (booking && !booking.flightTicketUploaded) {
          bgColor = 'bg-orange-100';
        } else {
          bgColor = 'bg-green-100';
        }
      } else if (isSelected) {
        bgColor = 'bg-blue-200';
      } else if (isInRange) {
        bgColor = 'bg-blue-100';
      }

      days.push(
        React.createElement('div', {
          key: day,
          onClick: () => handleDateClick(date),
          className: 'h-20 border border-gray-300 p-2 cursor-pointer transition-colors ' + bgColor
        },
          React.createElement('div', { className: "font-semibold text-sm" }, day),
          isBooked && booking && React.createElement('div', { className: "text-xs mt-1" },
            React.createElement('div', { className: "font-medium truncate" }, booking.name),
            React.createElement('div', { className: "text-gray-600" }, booking.guests + ' pers.'),
            React.createElement('div', { className: "flex items-center gap-1 mt-1" },
              booking.status === 'pending' && React.createElement(Clock, { className: "w-3 h-3" }),
              booking.status === 'confirmed' && !booking.flightTicketUploaded && React.createElement(AlertCircle, { className: "w-3 h-3" }),
              booking.flightTicketUploaded && React.createElement(Check, { className: "w-3 h-3" })
            )
          )
        )
      );
    }

    return React.createElement('div', { className: "bg-white rounded-lg shadow-lg p-6" },
      React.createElement('div', { className: "flex items-center justify-between mb-6" },
        React.createElement('button', {
          onClick: () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)),
          className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        }, '←'),
        React.createElement('h2', { className: "text-2xl font-bold" }, monthNames[month] + ' ' + year),
        React.createElement('button', {
          onClick: () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)),
          className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        }, '→')
      ),
      React.createElement('div', { className: "grid grid-cols-7 gap-0 mb-2" },
        dayNames.map(name => React.createElement('div', { key: name, className: "text-center font-semibold p-2 bg-gray-100" }, name))
      ),
      React.createElement('div', { className: "grid grid-cols-7 gap-0" }, days),
      React.createElement('div', { className: "mt-6 flex flex-wrap gap-4 text-sm" },
        React.createElement('div', { className: "flex items-center gap-2" },
          React.createElement('div', { className: "w-4 h-4 bg-white border-2 border-gray-300" }),
          React.createElement('span', null, 'Ledig')
        ),
        React.createElement('div', { className: "flex items-center gap-2" },
          React.createElement('div', { className: "w-4 h-4 bg-yellow-100 border-2 border-gray-300" }),
          React.createElement('span', null, 'Afventer godkendelse')
        ),
        React.createElement('div', { className: "flex items-center gap-2" },
          React.createElement('div', { className: "w-4 h-4 bg-orange-100 border-2 border-gray-300" }),
          React.createElement('span', null, 'Mangler flybilletter')
        ),
        React.createElement('div', { className: "flex items-center gap-2" },
          React.createElement('div', { className: "w-4 h-4 bg-green-100 border-2 border-gray-300" }),
          React.createElement('span', null, 'Bekræftet')
        )
      )
    );
  };

  return React.createElement('div', { className: "min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4" },
    React.createElement('div', { className: "max-w-6xl mx-auto" },
      React.createElement('div', { className: "text-center mb-8" },
        React.createElement('h1', { className: "text-4xl font-bold text-gray-800 mb-2" }, 'Cerros Del Aguila'),
        React.createElement('p', { className: "text-xl text-gray-600" }, 'Sommerhus Booking System'),
        React.createElement('div', { className: "flex items-center justify-center gap-2 mt-2" },
          React.createElement(Mail, {
            className: emailJsLoaded &&
              EMAIL_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY' &&
              EMAIL_CONFIG.SERVICE_ID !== 'YOUR_SERVICE_ID' &&
              EMAIL_CONFIG.TEMPLATE_ID !== 'YOUR_TEMPLATE_ID'
              ? "w-4 h-4 text-green-600"
              : "w-4 h-4 text-orange-600"
          }),
          React.createElement('span', {
            className: emailJsLoaded &&
              EMAIL_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY' &&
              EMAIL_CONFIG.SERVICE_ID !== 'YOUR_SERVICE_ID' &&
              EMAIL_CONFIG.TEMPLATE_ID !== 'YOUR_TEMPLATE_ID'
              ? "text-sm text-green-600"
              : "text-sm text-orange-600"
          },
            !emailJsLoaded ? 'Loader email-system...' :
            (EMAIL_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY' ||
             EMAIL_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID' ||
             EMAIL_CONFIG.TEMPLATE_ID === 'YOUR_TEMPLATE_ID')
              ? 'Email kræver konfiguration ⚠️'
              : 'Email-notifikationer aktiveret ✓'
          )
        ),
        React.createElement('button', {
          onClick: () => setShowAdminLogin(!showAdminLogin),
          className: "mt-4 text-sm text-blue-600 hover:underline"
        }, isAdmin ? 'Admin Mode Aktiv' : 'Admin Login')
      ),
      
      showAdminLogin && !isAdmin && React.createElement('div', { className: "bg-white rounded-lg shadow-lg p-6 mb-6" },
        React.createElement('h3', { className: "text-lg font-semibold mb-4" }, 'Admin Login'),
        React.createElement('div', { className: "flex gap-2" },
          React.createElement('input', {
            type: "password",
            value: adminPassword,
            onChange: (e) => setAdminPassword(e.target.value),
            placeholder: "Adgangskode",
            className: "flex-1 px-4 py-2 border rounded",
            onKeyPress: (e) => e.key === 'Enter' && handleAdminLogin()
          }),
          React.createElement('button', {
            onClick: handleAdminLogin,
            className: "px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          }, 'Login')
        )
      ),
      
      renderCalendar(),
      
      showBookingForm && React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" },
        React.createElement('div', { className: "bg-white rounded-lg shadow-xl p-6 max-w-md w-full" },
          React.createElement('div', { className: "flex justify-between items-center mb-4" },
            React.createElement('h3', { className: "text-2xl font-bold" }, 'Ny Booking'),
            React.createElement('button', {
              onClick: () => {
                setShowBookingForm(false);
                setSelectedDates({ start: null, end: null });
                setFormData({ name: '', guests: 1, comment: '' });
              }
            }, React.createElement(X, { className: "w-6 h-6" }))
          ),
          React.createElement('div', { className: "mb-4 p-3 bg-blue-50 rounded" },
            React.createElement('p', { className: "text-sm" },
              React.createElement('strong', null, 'Periode: '),
              selectedDates.start && selectedDates.start.toLocaleDateString('da-DK'),
              ' - ',
              selectedDates.end && selectedDates.end.toLocaleDateString('da-DK')
            ),
            React.createElement('p', { className: "text-sm mt-1" },
              React.createElement('strong', null, 'Antal dage: '),
              calculateDays(selectedDates.start, selectedDates.end)
            ),
            calculateDays(selectedDates.start, selectedDates.end) > 14 && React.createElement('p', { className: "text-sm mt-2 text-orange-600 font-semibold" },
              '⚠️ Denne booking kræver godkendelse fra Ulla eller Eric'
            )
          ),
          React.createElement('div', null,
            React.createElement('div', { className: "mb-4" },
              React.createElement('label', { className: "block text-sm font-semibold mb-2" }, 'Navn'),
              React.createElement('input', {
                type: "text",
                value: formData.name,
                onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                className: "w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500",
                placeholder: "Dit navn"
              })
            ),
            React.createElement('div', { className: "mb-4" },
              React.createElement('label', { className: "block text-sm font-semibold mb-2" }, 'Antal personer'),
              React.createElement('input', {
                type: "number",
                min: "1",
                value: formData.guests,
                onChange: (e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 }),
                className: "w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              })
            ),
            React.createElement('div', { className: "mb-4" },
              React.createElement('label', { className: "block text-sm font-semibold mb-2" }, 'Kommentar (valgfrit)'),
              React.createElement('textarea', {
                value: formData.comment,
                onChange: (e) => setFormData({ ...formData, comment: e.target.value }),
                className: "w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500",
                rows: 3,
                placeholder: "Evt. kommentarer..."
              })
            ),
            React.createElement('button', {
              onClick: (e) => {
                e.preventDefault();
                if (!formData.name.trim()) {
                  alert('Indtast venligst dit navn');
                  return;
                }
                handleBooking(e);
              },
              className: "w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            }, 'Bekræft Booking')
          )
        )
      ),
      
      selectedBooking && React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" },
        React.createElement('div', { className: "bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-screen overflow-y-auto" },
          React.createElement('div', { className: "flex justify-between items-center mb-4" },
            React.createElement('h3', { className: "text-2xl font-bold" }, 'Booking Detaljer'),
            React.createElement('button', { onClick: () => setSelectedBooking(null) },
              React.createElement(X, { className: "w-6 h-6" })
            )
          ),
          React.createElement('div', { className: "space-y-3" },
            React.createElement('div', { className: "p-3 bg-gray-50 rounded" },
              React.createElement('p', { className: "text-sm text-gray-600" }, 'Booket af'),
              React.createElement('p', { className: "text-lg font-semibold" }, selectedBooking.name)
            ),
            React.createElement('div', { className: "p-3 bg-gray-50 rounded" },
              React.createElement('p', { className: "text-sm text-gray-600" }, 'Periode'),
              React.createElement('p', { className: "font-semibold" },
                new Date(selectedBooking.startDate).toLocaleDateString('da-DK'),
                ' - ',
                new Date(selectedBooking.endDate).toLocaleDateString('da-DK')
              ),
              React.createElement('p', { className: "text-sm text-gray-600 mt-1" },
                '(',
                calculateDays(new Date(selectedBooking.startDate), new Date(selectedBooking.endDate)),
                ' dage)'
              )
            ),
            React.createElement('div', { className: "p-3 bg-gray-50 rounded" },
              React.createElement('p', { className: "text-sm text-gray-600" }, 'Antal personer'),
              React.createElement('p', { className: "text-lg font-semibold flex items-center gap-2" },
                React.createElement(Users, { className: "w-5 h-5" }),
                selectedBooking.guests + ' personer'
              )
            ),
            selectedBooking.comment && React.createElement('div', { className: "p-3 bg-gray-50 rounded" },
              React.createElement('p', { className: "text-sm text-gray-600" }, 'Kommentar'),
              React.createElement('p', { className: "mt-1 italic" }, selectedBooking.comment)
            ),
            React.createElement('div', { className: "p-3 bg-gray-50 rounded" },
              React.createElement('p', { className: "text-sm text-gray-600 mb-2" }, 'Status'),
              selectedBooking.status === 'pending' ? React.createElement('div', { className: "flex items-center gap-2 text-yellow-600" },
                React.createElement(Clock, { className: "w-5 h-5" }),
                React.createElement('span', { className: "font-semibold" }, 'Afventer godkendelse')
              ) : selectedBooking.flightTicketUploaded ? React.createElement('div', { className: "flex items-center gap-2 text-green-600" },
                React.createElement(Check, { className: "w-5 h-5" }),
                React.createElement('span', { className: "font-semibold" }, 'Bekræftet med flybilletter')
              ) : React.createElement('div', { className: "flex items-center gap-2 text-orange-600" },
                React.createElement(AlertCircle, { className: "w-5 h-5" }),
                React.createElement('span', { className: "font-semibold" }, 'Mangler flybilletter')
              )
            ),
            selectedBooking.flightTicketImage && React.createElement('div', { className: "p-3 bg-gray-50 rounded" },
              React.createElement('p', { className: "text-sm text-gray-600 mb-2" }, 'Flybilletter'),
              React.createElement('img', {
                src: selectedBooking.flightTicketImage,
                alt: "Flybilletter",
                className: "w-full rounded border mb-2"
              }),
              React.createElement('a', {
                href: selectedBooking.flightTicketImage,
                download: 'flybilletter-' + selectedBooking.name + '-' + new Date(selectedBooking.startDate).toLocaleDateString('da-DK') + '.jpg',
                className: "inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              },
                React.createElement(Upload, { className: "w-4 h-4" }),
                'Download Flybilletter'
              )
            )
          ),
          React.createElement('button', {
            onClick: () => setSelectedBooking(null),
            className: "w-full mt-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
          }, 'Luk')
        )
      ),
      
      isAdmin && React.createElement('div', { className: "mt-8 bg-white rounded-lg shadow-lg p-6" },
        React.createElement('h3', { className: "text-2xl font-bold mb-4" }, 'Admin Panel'),
        bookings.filter(b => b.status === 'pending').length > 0 && React.createElement('div', { className: "mb-6" },
          React.createElement('h4', { className: "text-lg font-semibold mb-3 text-orange-600" }, 'Afventer Godkendelse'),
          bookings.filter(b => b.status === 'pending').map(booking =>
            React.createElement('div', { key: booking.id, className: "border rounded p-4 mb-3 bg-yellow-50" },
              React.createElement('div', { className: "flex justify-between items-start gap-4" },
                React.createElement('div', { className: "flex-1" },
                  React.createElement('p', null,
                    React.createElement('strong', null, booking.name),
                    ' (' + booking.guests + ' personer)'
                  ),
                  React.createElement('p', { className: "text-sm text-gray-600" },
                    new Date(booking.startDate).toLocaleDateString('da-DK'),
                    ' - ',
                    new Date(booking.endDate).toLocaleDateString('da-DK'),
                    ' (',
                    calculateDays(new Date(booking.startDate), new Date(booking.endDate)),
                    ' dage)'
                  ),
                  booking.comment && React.createElement('p', { className: "text-sm mt-1 italic" }, booking.comment)
                ),
                React.createElement('div', { className: "flex gap-2 flex-shrink-0" },
                  React.createElement('button', {
                    onClick: () => approveBooking(booking.id),
                    className: "px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 whitespace-nowrap"
                  }, 'Godkend'),
                  React.createElement('button', {
                    onClick: () => rejectBooking(booking.id),
                    className: "px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 whitespace-nowrap"
                  }, 'Afvis')
                )
              )
            )
          )
        ),
        React.createElement('h4', { className: "text-lg font-semibold mb-3" }, 'Alle Bookinger'),
        bookings.filter(b => b.status === 'confirmed').length === 0 ? React.createElement('p', { className: "text-gray-500" }, 'Ingen bekræftede bookinger') :
        bookings.filter(b => b.status === 'confirmed').map(booking =>
          React.createElement('div', { key: booking.id, className: "border rounded p-4 mb-3" },
            React.createElement('div', { className: "flex justify-between items-start gap-4" },
              React.createElement('div', { className: "flex-1" },
                React.createElement('p', null,
                  React.createElement('strong', null, booking.name),
                  ' (' + booking.guests + ' personer)'
                ),
                React.createElement('p', { className: "text-sm text-gray-600" },
                  new Date(booking.startDate).toLocaleDateString('da-DK'),
                  ' - ',
                  new Date(booking.endDate).toLocaleDateString('da-DK')
                ),
                booking.comment && React.createElement('p', { className: "text-sm mt-1 italic" }, booking.comment),
                React.createElement('div', { className: "mt-2" },
                  booking.flightTicketUploaded ? React.createElement('span', { className: "text-sm text-green-600 flex items-center gap-1" },
                    React.createElement(Check, { className: "w-4 h-4" }),
                    ' Flybilletter uploadet'
                  ) : React.createElement('span', { className: "text-sm text-orange-600 flex items-center gap-1" },
                    React.createElement(AlertCircle, { className: "w-4 h-4" }),
                    ' Mangler flybilletter (deadline: ' + new Date(booking.flightTicketDeadline).toLocaleDateString('da-DK') + ')'
                  )
                )
              ),
              React.createElement('button', {
                onClick: () => deleteBooking(booking.id),
                className: "px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex-shrink-0"
              }, 'Slet')
            )
          )
        )
      ),
      
      React.createElement('div', { className: "mt-8 bg-white rounded-lg shadow-lg p-6" },
        React.createElement('h3', { className: "text-2xl font-bold mb-4" }, 'Mine Bookinger'),
        bookings.length === 0 ? React.createElement('p', { className: "text-gray-500" }, 'Ingen bookinger endnu. Vælg datoer i kalenderen for at booke.') :
        bookings.map(booking =>
          React.createElement('div', { key: booking.id, className: "border rounded p-4 mb-3" },
            React.createElement('div', { className: "flex justify-between items-start" },
              React.createElement('div', { className: "flex-1" },
                React.createElement('p', null,
                  React.createElement('strong', null, booking.name),
                  ' (' + booking.guests + ' personer)'
                ),
                React.createElement('p', { className: "text-sm text-gray-600" },
                  new Date(booking.startDate).toLocaleDateString('da-DK'),
                  ' - ',
                  new Date(booking.endDate).toLocaleDateString('da-DK')
                ),
                booking.comment && React.createElement('p', { className: "text-sm mt-1 italic" }, booking.comment),
                booking.status === 'pending' ? React.createElement('span', { className: "inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded" },
                  'Afventer godkendelse'
                ) : React.createElement('div', { className: "mt-3" },
                  !booking.flightTicketUploaded ? React.createElement('div', null,
                    React.createElement('p', { className: "text-sm text-orange-600 mb-2" },
                      'Upload flybilletter senest ' + new Date(booking.flightTicketDeadline).toLocaleDateString('da-DK')
                    ),
                    React.createElement('label', { className: "inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600" },
                      React.createElement(Upload, { className: "w-4 h-4" }),
                      'Upload Flybilletter',
                      React.createElement('input', {
                        type: "file",
                        accept: "image/*",
                        onChange: (e) => handleFileUpload(booking.id, e),
                        className: "hidden"
                      })
                    )
                  ) : React.createElement('div', { className: "flex items-center gap-2 text-green-600" },
                    React.createElement(Check, { className: "w-5 h-5" }),
                    React.createElement('span', null, 'Flybilletter uploadet')
                  )
                )
              )
            )
          )
        )
      ),
      
      React.createElement('div', { className: "mt-8 bg-blue-50 rounded-lg p-6" },
        React.createElement('h3', { className: "text-lg font-semibold mb-3" }, '📋 Sådan bruger du booking-systemet:'),
        React.createElement('ol', { className: "space-y-2 text-sm" },
          React.createElement('li', null, React.createElement('strong', null, '1.'), ' Klik på en startdato i kalenderen, og derefter på en slutdato'),
          React.createElement('li', null, React.createElement('strong', null, '2.'), ' Udfyld booking-formularen med navn, antal personer og evt. kommentar'),
          React.createElement('li', null, React.createElement('strong', null, '3.'), ' Bookinger over 14 dage sendes til godkendelse hos Ulla eller Eric'),
          React.createElement('li', null, React.createElement('strong', null, '4.'), ' Upload flybilletter inden 14 dage efter booking'),
          React.createElement('li', null, React.createElement('strong', null, '5.'), ' Ulla og Eric får automatisk email ved alle nye bookinger'),
          React.createElement('li', null, React.createElement('strong', null, '6.'), ' Klik på bookede dage for at se detaljer og downloade flybilletter')
        ),
        React.createElement('p', { className: "mt-4 text-sm text-gray-600" },
          React.createElement('strong', null, 'Admin adgangskode: '),
          'sommerhus2025'
        ),
        (EMAIL_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY' ||
         EMAIL_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID' ||
         EMAIL_CONFIG.TEMPLATE_ID === 'YOUR_TEMPLATE_ID') &&
        React.createElement('div', { className: "mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg" },
          React.createElement('h4', { className: "font-semibold text-orange-800 mb-2" }, '📧 Email Konfiguration Påkrævet'),
          React.createElement('p', { className: "text-sm text-orange-700 mb-2" },
            'For at aktivere email-notifikationer skal du:'
          ),
          React.createElement('ol', { className: "text-sm text-orange-700 space-y-1 ml-4" },
            React.createElement('li', null, '1. Opret en konto på emailjs.com'),
            React.createElement('li', null, '2. Opret en email service (Gmail, Outlook, etc.)'),
            React.createElement('li', null, '3. Opret en email template'),
            React.createElement('li', null, '4. Opdater EMAIL_CONFIG konstanten i app.jsx med dine værdier')
          )
        )
      )
    )
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(SommerhusBooking));
