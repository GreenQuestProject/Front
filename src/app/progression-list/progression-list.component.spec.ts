import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressionListComponent } from './progression-list.component';
import {provideHttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';

describe('ProgressionListComponent', () => {
  let component: ProgressionListComponent;
  let fixture: ComponentFixture<ProgressionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressionListComponent],
      providers: [provideHttpClient(), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: {} } } }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgressionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
