import { TestBed } from '@angular/core/testing';

import { ProgressionService } from './progression.service';
import {provideHttpClient} from '@angular/common/http';

describe('ProgressionService', () => {
  let service: ProgressionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(ProgressionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
