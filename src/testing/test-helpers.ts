import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Provider, Type } from '@angular/core';

export function provideTestingRouter() {
  return provideRouter([]);
}

/** Installe des spies communs utilisés dans la plupart des specs. */
export function setupCommonSpies() {
  const router = TestBed.inject(Router);
  const navigateByUrlSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
  const consoleErrorSpy = spyOn(console, 'error').and.stub();
  return { router, navigateByUrlSpy, consoleErrorSpy };
}

type RenderOptions = {
  imports?: any[];
  providers?: Provider[];
  /** S'exécute après la création du composant mais AVANT le 1er detectChanges() (donc avant ngOnInit). */
  beforeDetectChanges?: (ctx: {
    fixture: any;
    instance: any;
    element: HTMLElement;
  }) => void | Promise<void>;
};

/** Rend un composant standalone avec DI + spies communs. */
export async function renderStandalone<T>(
  component: Type<T>,
  options?: RenderOptions
) {
  await TestBed.configureTestingModule({
    imports: [component, ...(options?.imports ?? [])],
    providers: [provideTestingRouter(), ...(options?.providers ?? [])],
  }).compileComponents();

  const fixture = TestBed.createComponent(component);
  const instance = fixture.componentInstance as T;
  const element = fixture.nativeElement as HTMLElement;

  // Hook custom: configure tes spies AVANT ngOnInit
  if (options?.beforeDetectChanges) {
    await options.beforeDetectChanges({ fixture, instance, element });
  }

  // Spies communs APRÈS création (le Router existe maintenant)
  const spies = setupCommonSpies();

  // 1er cycle: déclenche ngOnInit si le composant l'utilise
  fixture.detectChanges();

  return { fixture, instance, element, ...spies };
}
