import { TestBed } from '@angular/core/testing';

import { ChallengeService } from './challenge.service';
import {provideHttpClient} from '@angular/common/http';

describe('ChallengeService', () => {
  let service: ChallengeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
       providers: [provideHttpClient()]
    });
    service = TestBed.inject(ChallengeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
