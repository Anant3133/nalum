import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database, Search, Loader2, UserCheck, XCircle, List, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AxiosError } from "axios";
import { BRANCHES } from "@/constants/branches";
import AdminLayout from "@/components/admin/AdminLayout";

interface VerificationMatch {
  name: string;
  roll_no: string;
  batch: string;
  branch: string;
  similarity?: number;
}

interface AlumniRecord {
  name: string;
  roll_no: string;
  batch: string;
  branch: string;
}

interface ApiErrorResponse {
  message?: string;
}

const AlumniDatabase = () => {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState("search");
  const [isLoading, setIsLoading] = useState(false);
  
  // Search state
  const [searchName, setSearchName] = useState("");
  const [searchRollNo, setSearchRollNo] = useState("");
  const [searchBatch, setSearchBatch] = useState("");
  const [searchBranch, setSearchBranch] = useState("");
  const [matches, setMatches] = useState<VerificationMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Database view state
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [allAlumni, setAllAlumni] = useState<AlumniRecord[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(50);
  const totalPages = Math.ceil(totalRecords / limit);

  const handleDatabaseSearch = async () => {
    if (!searchName.trim() && !searchRollNo.trim() && !searchBatch.trim() && !searchBranch) {
      toast.error("Please enter at least one search criteria");
      return;
    }

    setIsLoading(true);
    setMatches([]);
    setHasSearched(false);

    try {
      const response = await api.post(
        "/admin/search-alumni-database",
        {
          name: searchName,
          roll_no: searchRollNo,
          batch: searchBatch,
          branch: searchBranch,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.success) {
        const foundMatches = response.data.matches || [];
        setMatches(foundMatches);
        setHasSearched(true);
        
        if (foundMatches.length > 0) {
          toast.success(`Found ${foundMatches.length} match(es) in the database`);
        } else {
          toast.info("No matches found in the database");
        }
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message || "Database search failed";
      toast.error(message);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchName("");
    setSearchRollNo("");
    setSearchBatch("");
    setSearchBranch("");
    setMatches([]);
    setHasSearched(false);
  };

  // Fetch all alumni with pagination
  const fetchAllAlumni = async (page: number) => {
    setLoadingAll(true);
    try {
      const offset = (page - 1) * limit;
      const response = await api.get("/admin/all-alumni", {
        params: { limit, offset },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        setAllAlumni(response.data.matches || []);
        setTotalRecords(response.data.total || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message || "Failed to fetch alumni records";
      toast.error(message);
    } finally {
      setLoadingAll(false);
    }
  };

  // Fetch all batches
  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const response = await api.get("/admin/alumni-batches", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        setBatches(response.data.batches || []);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message || "Failed to fetch batches";
      toast.error(message);
    } finally {
      setLoadingBatches(false);
    }
  };

  // Fetch alumni by batch
  const fetchAlumniByBatch = async (batch: string, page: number = 1) => {
    setLoadingAll(true);
    try {
      const offset = (page - 1) * limit;
      const response = await api.get(`/admin/alumni-by-batch/${batch}`, {
        params: { limit, offset },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        setAllAlumni(response.data.matches || []);
        setTotalRecords(response.data.total || 0);
        setCurrentPage(page);
        setSelectedBatch(batch);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message || "Failed to fetch alumni records";
      toast.error(message);
    } finally {
      setLoadingAll(false);
    }
  };

  // Load batches when tab changes to database view
  useEffect(() => {
    if (activeTab === "database" && batches.length === 0) {
      fetchBatches();
    }
  }, [activeTab]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && selectedBatch) {
      fetchAlumniByBatch(selectedBatch, newPage);
    }
  };

  const handleBatchSelect = (batch: string) => {
    setCurrentPage(1);
    fetchAlumniByBatch(batch, 1);
  };

  const handleBackToBatches = () => {
    setSelectedBatch(null);
    setAllAlumni([]);
    setTotalRecords(0);
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Alumni Database
            </h1>
          </div>
          <p className="text-gray-600">
            Search or browse the college alumni database
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-white border border-gray-200">
            <TabsTrigger 
              value="search"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Search className="h-4 w-4" />
              Search Alumni
            </TabsTrigger>
            <TabsTrigger 
              value="database"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <List className="h-4 w-4" />
              Database View
            </TabsTrigger>
          </TabsList>

          {/* Search Alumni Tab */}
          <TabsContent value="search" className="mt-6 space-y-6">{/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Search Criteria
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Enter any combination of the following fields to search the database
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="search-name">Full Name</Label>
              <Input
                id="search-name"
                placeholder="Enter full name to search"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="search-roll">Roll Number</Label>
              <Input
                id="search-roll"
                placeholder="Enter roll number"
                value={searchRollNo}
                onChange={(e) => setSearchRollNo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search-batch">Batch/Year</Label>
                <Input
                  id="search-batch"
                  placeholder="e.g., 2020"
                  value={searchBatch}
                  onChange={(e) => setSearchBatch(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="search-branch">Branch</Label>
                <Select value={searchBranch} onValueChange={setSearchBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleDatabaseSearch}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching Database...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Database
                  </>
                )}
              </Button>
              <Button
                onClick={handleClearSearch}
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                Clear Search
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Search Results
            </h2>

            {matches.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  No records found matching your search criteria
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Try adjusting your search terms or using different criteria
                </p>
              </div>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800 font-medium">
                    <UserCheck className="inline h-4 w-4 mr-2" />
                    Found {matches.length} record(s) in the alumni database
                  </p>
                </div>

                <div className="space-y-4">
                  {matches.map((match, index) => (
                    <div
                      key={index}
                      className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {match.name}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500 font-medium">
                                Roll No:
                              </span>
                              <span className="ml-2 text-gray-900">
                                {match.roll_no}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                Branch:
                              </span>
                              <span className="ml-2 text-gray-900">
                                {match.branch}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium">
                                Batch:
                              </span>
                              <span className="ml-2 text-gray-900">
                                {match.batch}
                              </span>
                            </div>
                          </div>
                        </div>
                        {match.similarity !== undefined && match.similarity > 0 && (
                          <span className="ml-4 text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                            {(match.similarity * 100).toFixed(0)}% match
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3">ℹ️ About this Tool</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              • This tool searches the official alumni database maintained by the college
            </p>
            <p>
              • Search results are fuzzy-matched, so slight variations in names will still show results
            </p>
            <p>
              • Use this to verify alumni details when reviewing manual verification requests
            </p>
          </div>
        </div>
          </TabsContent>

          {/* Database View Tab */}
          <TabsContent value="database" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {!selectedBatch ? (
                // Batch Selection View
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Select Batch Year
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Choose a batch to view alumni records
                    </p>
                  </div>

                  {loadingBatches ? (
                    <div className="flex justify-center items-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : batches.length === 0 ? (
                    <div className="text-center py-12">
                      <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No batches found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {batches.map((batch) => (
                        <Button
                          key={batch}
                          onClick={() => handleBatchSelect(batch)}
                          variant="outline"
                          className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-500 transition-all"
                        >
                          <Database className="h-6 w-6 text-blue-600" />
                          <span className="text-2xl font-bold text-gray-900">{batch}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Alumni Table View
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleBackToBatches}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Batch {selectedBatch} Alumni
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Showing {totalRecords} total records
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => selectedBatch && fetchAlumniByBatch(selectedBatch, currentPage)}
                      variant="outline"
                      disabled={loadingAll}
                    >
                      {loadingAll ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Refresh"
                      )}
                    </Button>
                  </div>

                  {loadingAll ? (
                    <div className="flex justify-center items-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : allAlumni.length === 0 ? (
                    <div className="text-center py-12">
                      <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No records found</p>
                    </div>
                  ) : (
                    <>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold">#</TableHead>
                              <TableHead className="font-semibold">Name</TableHead>
                              <TableHead className="font-semibold">Roll Number</TableHead>
                              <TableHead className="font-semibold">Branch</TableHead>
                              <TableHead className="font-semibold">Batch</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allAlumni.map((alumni, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell className="font-medium">
                                  {(currentPage - 1) * limit + index + 1}
                                </TableCell>
                                <TableCell>{alumni.name}</TableCell>
                                <TableCell>{alumni.roll_no}</TableCell>
                                <TableCell>{alumni.branch}</TableCell>
                                <TableCell>{alumni.batch}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-600">
                          Showing {(currentPage - 1) * limit + 1} to{" "}
                          {Math.min(currentPage * limit, totalRecords)} of {totalRecords} records
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1 || loadingAll}
                            variant="outline"
                            size="sm"
                          >
                            First
                          </Button>
                          <Button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loadingAll}
                            variant="outline"
                            size="sm"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              Page {currentPage} of {totalPages}
                            </span>
                          </div>
                          <Button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loadingAll}
                            variant="outline"
                            size="sm"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages || loadingAll}
                            variant="outline"
                            size="sm"
                          >
                            Last
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AlumniDatabase;
