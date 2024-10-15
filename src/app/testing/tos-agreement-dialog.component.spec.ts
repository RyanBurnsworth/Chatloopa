import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TosAgreementDialog } from 'src/app/components/dialogs/tos-agreement-dialog/tos-agreement-dialog.component';

describe('TosAgreementDialog', () => {
  let component: TosAgreementDialog;
  let fixture: ComponentFixture<TosAgreementDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TosAgreementDialog ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TosAgreementDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
