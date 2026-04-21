

export const formatISOToInputDate = (dateString: string) => {
    if (!dateString) return "";
    // Creamos el objeto Date y usamos split para quedarnos solo con la parte YYYY-MM-DD
    return new Date(dateString).toISOString().split('T')[0];
};