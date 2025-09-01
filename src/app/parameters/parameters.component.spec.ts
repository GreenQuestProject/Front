import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { renderStandalone } from '../../testing/test-helpers';

import { ParametersComponent } from './parameters.component';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  template: '<nav data-testid="stub-nav">NavBar Stub</nav>',
})
class StubNavBarComponent {}

@Component({
  selector: 'app-notifications-settings',
  standalone: true,
  template: '<section data-testid="stub-notes">NotificationsSettings Stub</section>',
})
class StubNotificationsSettingsComponent {}

describe('ParametersComponent', () => {
  beforeEach(() => {
    TestBed.overrideComponent(ParametersComponent, {
      set: {
        imports: [StubNavBarComponent, StubNotificationsSettingsComponent],
      },
    });
  });

  it('devrait créer le composant', async () => {
    const { instance } = await renderStandalone(ParametersComponent);
    expect(instance).toBeTruthy();
  });

  it('DOM: rend <app-nav-bar>', async () => {
    const { element } = await renderStandalone(ParametersComponent);

    const nav = element.querySelector('app-nav-bar');
    const notes = element.querySelector('app-notifications-settings');

    expect(nav).withContext('app-nav-bar manquant').not.toBeNull();

    expect(notes).withContext('app-notifications-settings manquant').not.toBeNull();
  });

  it('DOM: <app-notifications-settings> est dans .container', async () => {
    const { element } = await renderStandalone(ParametersComponent);

    const wrapper = element.querySelector('.container');
    expect(wrapper).withContext('.container manquante').not.toBeNull();

    const nested = wrapper!.querySelector('app-notifications-settings');
    expect(nested).withContext('le composant notifications doit être dans .container').not.toBeNull();
  });
});
