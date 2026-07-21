import { token } from '../theme';
import { s, btn, card, input, label, errorText } from '../css';

/**
 * Shared chrome for the two public entry views (IA §3.17).
 *
 * Login and Register are the same composition with a different form inside it,
 * so the composition lives here once. Both components assign this to their own
 * `static styles`; the framework injects per component class, so the rules land
 * twice — identical text, no cascade consequence — which is the cheaper trade
 * against two hand-maintained copies drifting apart.
 *
 * LAYOUT. A narrow column pinned to the top of a 1400px viewport was the
 * complaint. The fix is not a wider column — a login form has four controls and
 * widening it only stretches the fields. Instead the panel is CENTRED in the
 * viewport (the shell's `--anon` rules make the content area do that) and given
 * vertical composition it did not have: wordmark, brass hairline, then the card.
 * The measure stays at 26rem, which keeps the fields at a comfortable size and
 * the whitespace around them deliberate rather than leftover.
 *
 * BRAND MOMENT. Design system §02 allows exactly ONE display/versal element per
 * view and names the login page as a place to spend it. That is the wordmark —
 * Lora 500, uppercase, .18em, 22/30. The page title below it is the ordinary
 * page-title role (Lora 500, 28/36, sentence case), not a second brand moment.
 * Both are weight 500 and nothing else: UI_DECISIONS §3 — one static Lora cut
 * ships, so 400 renders as 500 and 600 renders as synthetic bold.
 *
 * §05 failure mode 2 rules out the dark dramatic hero this page could easily
 * become. The surface stays the light-first app surface in both themes; the
 * brass appears only as the hairline it is meant to be.
 */
export const authStyles = `
    .auth {
        width: 100%;
        max-width: 26rem;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: ${s('xl')};

        /* Submitting freezes the form without clearing it (IA §3.17). */
        &[inert] { opacity: 0.6; }

        & .auth__brand {
            text-align: center;
        }

        /*
         * The one display/versal brand moment. The trailing .18em of tracking
         * hangs off the last letter, so the word reads a hair left of centre;
         * the matching indent puts it back.
         */
        & .auth__wordmark {
            margin: 0;
            font-family: ${token('font-display')};
            font-weight: 500;
            font-size: 22px;
            line-height: 30px;
            letter-spacing: 0.18em;
            text-indent: 0.18em;
            text-transform: uppercase;
            color: ${token('text')};
        }

        & .auth__rule {
            width: 56px;
            height: 1px;
            border: 0;
            margin: ${s('lg')} auto 0;
            background: ${token('brass-line')};
        }

        & .auth__card {
            ${card()}
            box-sizing: border-box;
            padding: ${s('2xl')} ${s('xl')};
        }

        & .auth__title {
            margin: 0;
            font-family: ${token('font-display')};
            font-weight: 500;
            font-size: 1.75rem;
            line-height: 36px;
            color: ${token('text')};
        }

        & .auth__lede {
            margin: ${s('sm')} 0 0;
            font-family: ${token('font-ui')};
            font-size: 14px;
            line-height: 22px;
            color: ${token('text-muted')};
        }

        /*
         * Form-level failure. Sits above the fields and inside the card so it
         * cannot be mistaken for page chrome. Body text stays --text rather
         * than --danger: a full sentence set in the danger colour on the
         * danger tint is the weakest contrast pairing the palette can produce,
         * and the border plus the tint already carry the signal.
         */
        & .auth__alert {
            display: none;
            margin: ${s('lg')} 0 0;
            padding: ${s('md')};
            border: 1px solid ${token('danger')};
            border-radius: ${token('radius-sm')};
            background: ${token('danger-soft')};
            font-family: ${token('font-ui')};
            font-size: 14px;
            line-height: 22px;
            color: ${token('text')};
        }
        & .auth__alert.is-shown { display: block; }

        & .auth__form {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            margin-top: ${s('xl')};
        }

        & .auth__field {
            display: flex;
            flex-direction: column;
            gap: ${s('xs')};
        }

        & .auth__label { ${label()} }

        & .auth__input {
            ${input()}
            box-sizing: border-box;
            width: 100%;
            /* 44px of hit target, and 16px so iOS Safari does not zoom on focus. */
            min-height: 44px;
            padding: ${s('sm')} ${s('md')};
            font-size: 16px;
            line-height: 24px;
        }
        /* Invalid state is not carried by colour alone — the field also gets a
           named error message below it, tied to it by aria-describedby. */
        & .auth__input[aria-invalid='true'] {
            border-color: ${token('danger')};
        }

        & .auth__hint {
            margin: 0;
            font-family: ${token('font-ui')};
            font-size: 13px;
            line-height: 20px;
            color: ${token('text-muted')};
        }

        & .auth__error {
            ${errorText()}
            display: none;
        }
        & .auth__error.is-shown { display: block; }
        /* Once a field states its problem, its hint is redundant noise. */
        & .auth__field.is-invalid .auth__hint { display: none; }

        /* §4.8: at most one primary button per form. This is it. */
        & .auth__submit {
            ${btn(token('radius-sm'), 'primary')}
            width: 100%;
            min-height: 44px;
            padding: ${s('sm')} ${s('lg')};
            font-size: 15px;
            line-height: 24px;
            margin-top: ${s('xs')};
        }

        & .auth__alt {
            margin: 0;
            text-align: center;
            font-family: ${token('font-ui')};
            font-size: 14px;
            line-height: 22px;
            color: ${token('text-muted')};
        }

        & .auth__alt-link {
            color: ${token('accent')};
            font-weight: 600;
            text-decoration: none;
            border-radius: ${token('radius-sm')};
        }
        & .auth__alt-link:hover {
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        & .auth__alt-link:focus-visible {
            outline: 2px solid ${token('accent')};
            outline-offset: 2px;
        }

        /* Phone: the card gives up its side padding and the gaps tighten, so the
           fields keep their width instead of the chrome keeping its margins. */
        @media (max-width: 479px) {
            gap: ${s('lg')};

            & .auth__card {
                padding: ${s('xl')} ${s('lg')};
            }
        }
    }
`;
