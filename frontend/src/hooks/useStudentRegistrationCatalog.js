import { useCallback, useEffect, useState } from "react";
import * as facultyService from "../services/facultyService";
import * as degreeService from "../services/lmsDegreeProgramService";
import * as registrationService from "../services/registrationService";

/**
 * Loads faculties / degrees / intakes / subgroups for the student registration form
 * (same cascading behaviour as Admin → Users → Students).
 */
export function useStudentRegistrationCatalog(form) {
  const [faculties, setFaculties] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [subgroupOptions, setSubgroupOptions] = useState([]);
  const [loadingSubgroups, setLoadingSubgroups] = useState(false);

  useEffect(() => {
    facultyService.listFaculties().then(setFaculties).catch(() => setFaculties([]));
  }, []);

  const loadDegrees = useCallback(async (facultyCode) => {
    if (!facultyCode) {
      setDegrees([]);
      return;
    }
    try {
      const data = await degreeService.listDegreePrograms({
        faculty: facultyCode,
        page: 1,
        pageSize: 200,
      });
      setDegrees(data.items || []);
    } catch {
      setDegrees([]);
    }
  }, []);

  useEffect(() => {
    if (form.facultyId) {
      loadDegrees(form.facultyId);
    } else {
      setDegrees([]);
    }
  }, [form.facultyId, loadDegrees]);

  useEffect(() => {
    const loadInt = async () => {
      if (!form.facultyId || !form.degreeProgramId) {
        setIntakes([]);
        return;
      }
      try {
        const data = await registrationService.listIntakes({
          facultyCode: form.facultyId,
          degreeCode: form.degreeProgramId,
        });
        setIntakes(Array.isArray(data) ? data : []);
      } catch {
        setIntakes([]);
      }
    };
    loadInt();
  }, [form.facultyId, form.degreeProgramId]);

  useEffect(() => {
    const run = async () => {
      if (!form.intakeId || !form.facultyId || !form.degreeProgramId || !form.stream) {
        setSubgroupOptions([]);
        return;
      }
      setLoadingSubgroups(true);
      try {
        const data = await registrationService.listIntakeSubgroups(form.intakeId, {
          facultyId: form.facultyId,
          degreeProgramId: form.degreeProgramId,
          stream: form.stream,
          status: "ACTIVE",
        });
        setSubgroupOptions(data.items || []);
      } catch {
        setSubgroupOptions([]);
      } finally {
        setLoadingSubgroups(false);
      }
    };
    run();
  }, [form.intakeId, form.facultyId, form.degreeProgramId, form.stream]);

  return {
    faculties,
    degrees,
    intakes,
    subgroupOptions,
    loadingSubgroups,
  };
}
