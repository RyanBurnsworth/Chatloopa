import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  private interactionSubject = new Subject<string>();
  private interaction$ = this.interactionSubject.asObservable();

  constructor() { }

  /**
   * Emit an interaction event
   * @param interaction 
   */
  public emitInteraction(interaction: string) {
    this.interactionSubject.next(interaction);
  }

  /**
   * Get the interaction event
   * @returns 
   */
  public getInteraction() {
    return this.interaction$;
  }
}
