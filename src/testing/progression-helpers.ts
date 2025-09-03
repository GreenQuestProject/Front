import { Subject, Observable } from 'rxjs';
import { Progression } from '../app/interfaces/progression';

export const PROGRESSIONS_FIXTURE: Progression[] = [
  { id: 1, name: 'A', category: 'ecology', status: 'pending',      description: '...' } as Progression,
  { id: 2, name: 'B', category: 'health',  status: 'in_progress',  description: '...' } as Progression,
  { id: 3, name: 'C', category: 'health',  status: 'failed',       description: '...' } as Progression,
];

export function cloneProgressions(list: Progression[]): Progression[] {
  return list.map(p => ({ ...p }));
}

export function stubGetProgressionsSeq(spy: jasmine.Spy, ...responses: Observable<Progression[]>[]) {
  spy.calls.reset();
  spy.and.returnValues(...responses);
}

export function makePending<T = any>() {
  const subj = new Subject<T>();
  return {
    $: subj.asObservable(),
    next: (v: T) => subj.next(v),
    complete: () => subj.complete(),
    error: (err: any) => subj.error(err),
  };
}

export const TEXTS = {
  notFound: 'Aucune progression trouvée. Essayez de modifier vos filtres.',
  formInvalid: 'Veuillez remplir correctement le formulaire avant de le soumettre.',
  registerErr: "Une erreur inattendue s'est produite. Veuillez réessayer ultérieurement.",
};
