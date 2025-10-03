package projecttree

type FileInfo struct {
	Path     string
	IsDir    bool
	Children []FileInfo
}

type DirectoryLister interface {
	ListDirectory(path string) ([]FileInfo, error)
}
