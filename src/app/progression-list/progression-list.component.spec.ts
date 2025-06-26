import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressionListComponent } from './progression-list.component';

describe('ProgressionListComponent', () => {
  let component: ProgressionListComponent;
  let fixture: ComponentFixture<ProgressionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressionListComponent]
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
