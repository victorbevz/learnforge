import { forwardDraftRequest } from "../draft-request";

export function POST(request: Request) {
  return forwardDraftRequest(request, "/courses/generate-from-pdf");
}
