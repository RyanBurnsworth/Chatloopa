import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntitialDialogComponent } from './intitial-dialog.component';

describe('IntitialDialogComponent', () => {
  let component: IntitialDialogComponent;
  let fixture: ComponentFixture<IntitialDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IntitialDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IntitialDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
