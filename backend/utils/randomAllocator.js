/**
 * Randomly allocates topics to students ensuring fair distribution
 */
const allocateRandomly = (topics, students) => {
  if (!topics.length || !students.length) return [];
  
  const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
  const allocations = [];
  
  topics.forEach((topic, index) => {
    const student = shuffledStudents[index % shuffledStudents.length];
    allocations.push({ topic, studentId: student._id });
  });
  
  return allocations;
};

/**
 * Allocate a project to student based on skill match
 */
const allocateProjectBySkills = (projects, student) => {
  if (!student.skills || !student.skills.length) return null;
  
  const matchingProjects = projects.filter(project => {
    if (!project.requiredSkills || !project.requiredSkills.length) return false;
    const matchCount = project.requiredSkills.filter(skill => 
      student.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
    ).length;
    return matchCount > 0;
  });
  
  if (!matchingProjects.length) return projects[0] || null;
  
  // Sort by best skill match
  matchingProjects.sort((a, b) => {
    const aMatch = a.requiredSkills.filter(s => 
      student.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase())
    ).length;
    const bMatch = b.requiredSkills.filter(s => 
      student.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase())
    ).length;
    return bMatch - aMatch;
  });
  
  return matchingProjects[0];
};

module.exports = { allocateRandomly, allocateProjectBySkills };
