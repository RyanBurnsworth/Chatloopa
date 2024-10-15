import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenericVideoComponent } from 'src/app/components/generic-video/generic-video.component';

describe('GenericVideoComponent', () => {
  let component: GenericVideoComponent;
  let fixture: ComponentFixture<GenericVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GenericVideoComponent]  // <-- Changed from imports to declarations
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
