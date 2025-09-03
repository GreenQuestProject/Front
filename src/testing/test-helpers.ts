import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Provider, Type } from '@angular/core';

export function provideTestingRouter() {
  return provideRouter([]);
}

export function setupCommonSpies() {
  const router = TestBed.inject(Router);
  const navigateByUrlSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
  const consoleErrorSpy = spyOn(console, 'error').and.stub();
  return { router, navigateByUrlSpy, consoleErrorSpy };
}

type RenderOptions = {
  imports?: any[];
  providers?: Provider[];
  beforeDetectChanges?: (ctx: {
    fixture: any;
    instance: any;
    element: HTMLElement;
  }) => void | Promise<void>;
};

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

  if (options?.beforeDetectChanges) {
    await options.beforeDetectChanges({ fixture, instance, element });
  }

  const spies = setupCommonSpies();

  fixture.detectChanges();

  return { fixture, instance, element, ...spies };
}
