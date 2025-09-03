import {TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {PwaUpdateService} from './services/pwa-update.service';
import {PushBridgeService} from './services/push-bridge.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {provide: PwaUpdateService, useValue: {}},
        {provide: PushBridgeService, useValue: {}},
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have title "GreenQuest"', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toBe('GreenQuest');
  });
});
