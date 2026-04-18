import { useMemo } from "react";
import StudentRegistrationFormBody from "../registration/StudentRegistrationFormBody";
import { emptyStudentForm } from "../registration/studentConstants";
import { useStudentRegistrationCatalog } from "../../hooks/useStudentRegistrationCatalog";

/**
 * Sign-up only: same {@link StudentRegistrationFormBody} as Admin → Users → Students, plus primary email line.
 */
function SignupStudentRegistrationBlock({ draft, onDraftChange, primaryEmail }) {
  const form = useMemo(() => {
    if (!draft || draft.kind !== "STUDENT") {
      return emptyStudentForm();
    }
    const { kind: _k, ...rest } = draft;
    return rest;
  }, [draft]);

  const setForm = (fn) => {
    onDraftChange((d) => {
      if (!d || d.kind !== "STUDENT") {
        return d;
      }
      return fn(d);
    });
  };

  const { faculties, degrees, intakes, subgroupOptions, loadingSubgroups } =
    useStudentRegistrationCatalog(form);

  return (
    <StudentRegistrationFormBody
      degrees={degrees}
      faculties={faculties}
      form={form}
      intakes={intakes}
      loadingSubgroups={loadingSubgroups}
      setForm={setForm}
      signupPrimaryEmail={primaryEmail}
      subgroupOptions={subgroupOptions}
    />
  );
}

export default SignupStudentRegistrationBlock;
