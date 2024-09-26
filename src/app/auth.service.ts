import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, map, BehaviorSubject, Observable } from 'rxjs';
import { Member } from './models/member';
import { isPlatformBrowser } from '@angular/common';

const url = 'https://66a0e4807053166bcabd467e.mockapi.io/api/v1/members';

export class InvalidPasswordError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidPasswordError.prototype);
  }
}

export class InvalidUserError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidUserError.prototype);
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  private isAdminSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;
  public isAdmin$: Observable<boolean>;
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.getStoredAuthState());
    this.isAdminSubject = new BehaviorSubject<boolean>(this.getStoredAdminState());
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
    this.isAdmin$ = this.isAdminSubject.asObservable();
  }

  async login(username: string, password: string): Promise<boolean> {
    const members = await this.getMembers();
    
    for (let i of members) {
      if (i.username === username) {
        if (i.password === password) {
          const isAdmin = i.username === 'admin';
          this.setAuthState(true, isAdmin);
          this.setInStorage('userSession', JSON.stringify({ username, isAuthenticated: true, isAdmin }));
          return isAdmin;
        } else {
          throw new InvalidPasswordError('Invalid Password');
        }
      }
    }
  
    throw new InvalidUserError('Invalid Username');
  }

  logout(): void {
    this.setAuthState(false, false);
    this.removeFromStorage('userSession');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    console.log('AuthService#isLoggedIn called, current value:', this.isAuthenticatedSubject.value);
    return this.isAuthenticatedSubject.value;
    this.router.navigate(['/user-dashboard']);
  }
  

  isUserAdmin(): boolean {
    return this.isAdminSubject.value;
    this.router.navigate(['/admin-dashboard']);
  }

  private async getMembers(): Promise<Member[]> {
    return await lastValueFrom(
      this.http
        .get(url)
        .pipe(map((a) => (<[]>a).map(i => new Member(i['id'], i['username'], i['password']))))
    );
  }

  private setAuthState(isAuthenticated: boolean, isAdmin: boolean): void {
    this.setInStorage('userSession', JSON.stringify({ isAuthenticated, isAdmin }));
    this.isAuthenticatedSubject.next(isAuthenticated);
    this.isAdminSubject.next(isAdmin);
  }

  getStoredAuthState(): boolean {
    const storedSession = this.getFromStorage('userSession');
    return storedSession ? JSON.parse(storedSession).isAuthenticated : false;
  }

  getUserData(username: string): Promise<Member> {
    return lastValueFrom(
      this.http.get<Member[]>(url).pipe(
        map(members => members.find(member => member.username === username)!)
      )
    );
  }

  getStoredUsername(): string {
    const userSession = this.getFromStorage('userSession');
    return userSession ? JSON.parse(userSession).username : '';
  }
  

  private getStoredAdminState(): boolean {
    const storedSession = this.getFromStorage('userSession');
    return storedSession ? JSON.parse(storedSession).isAdmin : false;
  }

  private setInStorage(key: string, value: string): void {
    if (this.isBrowser) {
      localStorage.setItem(key, value);
    }
  }

  private getFromStorage(key: string): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(key);
    }
    return null;
  }

  private removeFromStorage(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    }
  }
}