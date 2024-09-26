import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { OnInit } from '@angular/core';

interface Appointment {
  date: string;
  service: string;
}

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule]
})
export class UserDashboardComponent {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  activeTab: string = 'profile';
  user = {
    name: '',
    email: '',
    phone: '', 
    address: ''
  };
  editMode: boolean = false; 
  editedUser = { ...this.user }; 
  
  appointments: Appointment[] = [];
  newAppointment: Appointment = {
    date: '',
    service: ''
  };

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin,timeGridPlugin],
    initialView: 'dayGridMonth',
    dateClick: this.handleDateClick.bind(this),
    events: this.appointments.map(app => ({
      title: app.service,
      date: app.date
    })),
    eventColor: '#378006',
    eventBackgroundColor: '#378006',
    eventBorderColor: '#378006',
    eventTextColor: '#ffffff',
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true
  };

  constructor(private authService: AuthService) { }
  
  ngOnInit(): void {
    const currentUsername = this.authService.getStoredUsername(); // Example method to get stored username
    this.authService.getUserData(currentUsername).then(userData => {
      if (userData) {
        this.user = {
          name: userData.username ?? 'No Name Provided',
          email: userData.email ?? 'No Email Provided',
          phone: userData.phone ?? 'No Phone Provided',
          address: userData.address ?? 'No Address Provided'
        };
        this.editedUser = { ...this.user };
      } else {
        console.error('User data is undefined or null.');
      }
    }).catch(error => {
      console.error('Error fetching user data:', error);
    });
  }
  

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  logout(): void {
    this.authService.logout();
  }

  editProfile(): void {
    this.editMode = true;
  }

  saveProfile(): void {
    this.user = { ...this.editedUser };
    this.editMode = false;
  }

  cancelEdit(): void {
    this.editedUser = { ...this.user };
    this.editMode = false;
  }

  cancelAppointment(appointment: Appointment): void {
    this.appointments = this.appointments.filter(app => app !== appointment);
    this.updateCalendarEvents();
  }

  bookAppointment(): void {
    if (this.newAppointment.date && this.newAppointment.service) {
      this.appointments.push({...this.newAppointment});
      this.newAppointment = { date: '', service: '' };
      this.updateCalendarEvents();
    } else {
      console.log('Please select both date and service');
    }
  }

  handleDateClick(arg: DateClickArg): void {
    this.newAppointment.date = arg.dateStr;
  }

  updateCalendarEvents(): void {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.removeAllEvents();
    calendarApi.addEventSource(this.appointments.map(app => ({
      title: app.service,
      date: app.date
    })));
  }
}
