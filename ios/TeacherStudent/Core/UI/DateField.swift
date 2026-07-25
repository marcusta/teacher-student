import SwiftUI

/// An optional calendar date: a switch saying whether the record has this date
/// at all, and a day picker once it does. `YYYY-MM-DD` on the wire — a target
/// date, a plan's start and a plan's end are all DAYS the reader chose, not
/// instants, and the empty string is the absence.
///
/// The label is printed EXACTLY once, on the switch. `DatePicker` draws its own
/// label from the string it is given, so the obvious spelling of this control
/// renders "Måldatum" twice, one row under the other, which reads as two
/// separate fields. The picker keeps the label for VoiceOver, where it is the
/// only thing naming what the wheel sets.
///
/// Lives in Core because Mål and Planer had grown one copy each — and they had
/// already drifted apart on exactly this bug.
struct DateField: View {
    let label: String
    @Binding var iso: String
    /// The day the switch seeds when it is turned on. Today unless the caller
    /// knows better — a plan's END date seeded with today is already invalid the
    /// moment it appears if the plan starts next month, and a control whose
    /// first state is an error is the control teaching the reader they did
    /// something wrong before they did anything.
    var initialISO: String?

    private var isSet: Binding<Bool> {
        Binding(
            get: { !iso.isEmpty },
            set: { on in
                guard on else { iso = ""; return }
                let seed = initialISO.flatMap { $0.isEmpty ? nil : $0 }
                iso = seed ?? I18n.formatIsoDate(Date())
            }
        )
    }

    private var day: Binding<Date> {
        Binding(
            get: { I18n.calendarDate(fromISO: iso) ?? Date() },
            set: { iso = I18n.formatIsoDate($0) }
        )
    }

    var body: some View {
        Toggle(label, isOn: isSet)
        if !iso.isEmpty {
            DatePicker(label, selection: day, displayedComponents: .date)
                .labelsHidden()
                // `.compact` draws a container with its own accessibility
                // children, and a label set on a container that is not itself an
                // element does not reach them — so the group is made an element
                // that CONTAINS them and named here. Without this the wheel is
                // announced as a bare date with nothing saying what it sets.
                .accessibilityElement(children: .contain)
                .accessibilityLabel(label)
                .frame(maxWidth: .infinity, alignment: .leading)
                .datePickerStyle(.compact)
                .environment(\.locale, I18n.locale)
        }
    }
}
