import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebConferenceComponent } from './web-conference.component';

describe('WebConferenceComponent', () => {
  let component: WebConferenceComponent;
  let fixture: ComponentFixture<WebConferenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebConferenceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebConferenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
